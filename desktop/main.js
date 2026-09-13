const { app, BrowserWindow, dialog, ipcMain, session } = require('electron');
const path = require('path');
const fs = require('fs');

const projectRoot = path.resolve(__dirname, '..');
const webRoot = path.join(projectRoot, 'Hinata');
const dataRoot = app.isPackaged ? path.join(app.getPath('userData'), 'data') : path.join(webRoot, 'data');
let workRoot = null;

function ensureDataRoot() {
    fs.mkdirSync(path.join(dataRoot, 'conversations'), { recursive: true });
    fs.mkdirSync(path.join(dataRoot, 'settings'), { recursive: true });
}

function safeName(name) {
    return String(name).replace(/[<>:"/\\|?*]/g, '_');
}

function settingsPath() { return path.join(dataRoot, 'settings', 'local-storage.json'); }
function conversationsPath(name) { return path.join(dataRoot, 'conversations', safeName(name)); }

function readJson(file, fallback) {
    try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (_) { return fallback; }
}
function writeJson(file, value) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const temporary = `${file}.tmp`;
    fs.writeFileSync(temporary, JSON.stringify(value, null, 2), 'utf8');
    fs.renameSync(temporary, file);
}

function workPath(relativePath = '') {
    if (!workRoot) throw new Error('Aucun dossier Work sélectionné');
    const candidate = path.resolve(workRoot, relativePath);
    const relative = path.relative(workRoot, candidate);
    if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('Chemin Work hors dossier autorisé');
    return candidate;
}

function listWorkTree(directory = workRoot, prefix = '', result = []) {
    if (result.length >= 400) return result;
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const relative = prefix ? path.join(prefix, entry.name) : entry.name;
        if (entry.isDirectory()) {
            result.push(`${relative}/`);
            listWorkTree(path.join(directory, entry.name), relative, result);
        } else result.push(relative);
        if (result.length >= 400) break;
    }
    return result;
}

function registerStorageIpc() {
    ipcMain.on('kiro-storage-get', (event, key) => {
        const store = readJson(settingsPath(), {});
        event.returnValue = Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
    });
    ipcMain.on('kiro-storage-set', (event, key, value) => {
        const store = readJson(settingsPath(), {});
        store[key] = String(value);
        writeJson(settingsPath(), store);
        event.returnValue = true;
    });
    ipcMain.on('kiro-storage-remove', (event, key) => {
        const store = readJson(settingsPath(), {});
        delete store[key];
        writeJson(settingsPath(), store);
        event.returnValue = true;
    });
    ipcMain.on('kiro-storage-clear', event => {
        writeJson(settingsPath(), {});
        event.returnValue = true;
    });
    ipcMain.on('kiro-conversation-list', event => {
        ensureDataRoot();
        event.returnValue = fs.readdirSync(path.join(dataRoot, 'conversations')).filter(name => name.endsWith('.json'));
    });
    ipcMain.on('kiro-conversation-read', (event, name) => {
        event.returnValue = readJson(conversationsPath(name), null);
    });
    ipcMain.on('kiro-conversation-write', (event, name, value) => {
        writeJson(conversationsPath(name), typeof value === 'string' ? JSON.parse(value) : value);
        event.returnValue = true;
    });
    ipcMain.on('kiro-work-choose', event => {
        const result = dialog.showOpenDialogSync({ properties: ['openDirectory', 'createDirectory'] });
        if (!result || result.length === 0) {
            event.returnValue = null;
            return;
        }
        workRoot = result[0];
        event.returnValue = { name: path.basename(workRoot), path: workRoot };
    });
    ipcMain.on('kiro-work-set', (event, directory) => {
        try {
            if (typeof directory !== 'string' || !directory) throw new Error('Dossier invalide');
            if (!fs.statSync(directory).isDirectory()) throw new Error('Le chemin n’est pas un dossier');
            workRoot = directory;
            event.returnValue = { name: path.basename(workRoot), path: workRoot };
        } catch (_) {
            workRoot = null;
            event.returnValue = null;
        }
    });
    ipcMain.on('kiro-work-list', event => {
        try { event.returnValue = workRoot ? listWorkTree() : []; } catch (_) { event.returnValue = []; }
    });
    ipcMain.on('kiro-work-read', (event, relativePath) => {
        try {
            const file = workPath(relativePath);
            if (fs.statSync(file).size > 250000) throw new Error('Fichier trop volumineux');
            event.returnValue = fs.readFileSync(file, 'utf8');
        } catch (_) { event.returnValue = null; }
    });
    ipcMain.on('kiro-work-write', (event, relativePath, content) => {
        try {
            const file = workPath(relativePath);
            fs.mkdirSync(path.dirname(file), { recursive: true });
            fs.writeFileSync(file, String(content), 'utf8');
            event.returnValue = true;
        } catch (_) { event.returnValue = false; }
    });
    ipcMain.on('kiro-work-delete', (event, relativePath) => {
        try { fs.rmSync(workPath(relativePath), { recursive: false, force: false }); event.returnValue = true; }
        catch (_) { event.returnValue = false; }
    });
}

function createWindow() {
    ensureDataRoot();
    const window = new BrowserWindow({
        width: 1440,
        height: 920,
        minWidth: 960,
        minHeight: 640,
        backgroundColor: '#ffffff',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false
        }
    });
    window.loadFile(path.join(webRoot, 'index.html'));
}

// Enregistrer les canaux avant de créer une fenêtre afin qu'aucun renderer
// préchargé ne puisse les appeler avant leur disponibilité.
registerStorageIpc();

app.whenReady().then(() => {
    session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
        callback(permission === 'media' || permission === 'notifications');
    });
    createWindow();
    app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
