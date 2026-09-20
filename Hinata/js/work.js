// Mode Work : partage explicite d'un dossier local via File System Access API.
(function () {
    'use strict';
    const STORAGE_KEY = 'minou-work-settings';
    let rootHandle = null;
    let settings = loadSettings();

    function loadSettings() {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch (_) { return {}; }
    }
    function saveSettings() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            enabled: !!settings.enabled,
            read: settings.read !== false,
            write: settings.write === true,
            rootName: settings.rootName || ''
        }));
    }
    function isDesktop() {
        return !!window.kiroDesktop?.work;
    }
    function isSafePath(path) {
        return typeof path === 'string' && path.trim() && !path.startsWith('/') &&
            !path.split('/').some(part => !part || part === '.' || part === '..' || /[\\:*?"<>|]/.test(part));
    }
    function getDirectory(handle, parts, create = false) {
        return parts.reduce((promise, part) => promise.then(current => current.getDirectoryHandle(part, { create })), Promise.resolve(handle));
    }
    async function getFile(path) {
        if (!rootHandle || !isSafePath(path)) throw new Error('Chemin Work invalide');
        const parts = path.split('/');
        const name = parts.pop();
        const directory = await getDirectory(rootHandle, parts);
        return directory.getFileHandle(name);
    }
    async function readText(path) {
        if (isDesktop()) {
            const content = window.kiroDesktop.work.read(path);
            if (content == null) throw new Error('Lecture impossible');
            return content;
        }
        const file = await (await getFile(path)).getFile();
        if (file.size > 250000) throw new Error('Fichier trop volumineux');
        return file.text();
    }
    function arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let index = 0; index < bytes.length; index++) binary += String.fromCharCode(bytes[index]);
        return btoa(binary);
    }
    function isTextPath(path) {
        return /\.(txt|md|csv|json|xml|svg|log|js|ts|jsx|tsx|html|css|scss|py|java|go|rs|yaml|yml)$/i.test(path);
    }
    async function readFile(path) {
        if (!isSafePath(path) || path.endsWith('/')) throw new Error('Fichier Work invalide');
        if (isDesktop()) {
            const result = window.kiroDesktop.work.readBinary(path);
            if (!result) throw new Error('Lecture impossible');
            if (isTextPath(path) && result.size > 250000) throw new Error('Fichier texte trop volumineux');
            if (isTextPath(path)) {
                const bytes = Uint8Array.from(atob(result.base64), character => character.charCodeAt(0));
                result.textContent = new TextDecoder().decode(bytes);
            }
            return result;
        }
        const file = await (await getFile(path)).getFile();
        if (file.size > (isTextPath(path) ? 250000 : 10 * 1024 * 1024)) throw new Error('Fichier trop volumineux');
        const buffer = await file.arrayBuffer();
        const result = { name: file.name, mimeType: file.type || 'application/octet-stream', size: file.size, base64: arrayBufferToBase64(buffer) };
        if (isTextPath(path)) result.textContent = new TextDecoder().decode(buffer);
        return result;
    }
    async function listTree(handle = rootHandle, prefix = '', result = []) {
        if (isDesktop()) return window.kiroDesktop.work.list();
        for await (const entry of handle.values()) {
            const path = prefix ? `${prefix}/${entry.name}` : entry.name;
            if (entry.kind === 'directory') {
                result.push(`${path}/`);
                if (result.length < 400) await listTree(entry, path, result);
            } else if (result.length < 400) result.push(path);
        }
        return result;
    }
    function render() {
        const status = document.getElementById('work-status');
        const button = document.getElementById('work-btn');
        const label = document.getElementById('work-btn-label');
        if (status) status.textContent = rootHandle ? `${rootHandle.name} · ${settings.write ? 'lecture et écriture activées' : 'lecture seule'}` : 'Aucun dossier partagé';
        if (button) button.classList.toggle('active', !!rootHandle && settings.enabled);
        if (label) {
            label.hidden = !(rootHandle && settings.enabled);
            label.textContent = rootHandle?.name || '';
            if (rootHandle?.name) button.title = `Dossier Work : ${rootHandle.name}`;
        }
        const write = document.getElementById('work-write-toggle');
        if (write) write.checked = !!settings.write;
        document.dispatchEvent(new CustomEvent('work-state-change'));
    }
    async function chooseFolder() {
        if (isDesktop()) {
            const selected = window.kiroDesktop.work.chooseFolder();
            if (!selected) return;
            rootHandle = selected;
            settings.rootName = selected.name;
            settings.enabled = true;
            settings.read = true;
            saveSettings();
            render();
            window.saveConversation?.();
            document.dispatchEvent(new CustomEvent('work-folder-selected'));
            return;
        }
        if (typeof window.showDirectoryPicker !== 'function') {
            alert('Le partage de dossier nécessite http://localhost ou https://.');
            return;
        }
        try {
            rootHandle = await window.showDirectoryPicker({ mode: 'read' });
            settings.rootName = rootHandle.name;
            settings.enabled = true;
            settings.read = true;
            saveSettings();
            render();
            window.saveConversation?.();
            document.dispatchEvent(new CustomEvent('work-folder-selected'));
        } catch (error) {
            if (error.name !== 'AbortError') console.error('Work : sélection impossible', error);
        }
    }
    async function getPromptContext() {
        if (!rootHandle || !settings.enabled || settings.read === false) return '';
        const tree = await listTree();
        const files = tree.filter(path => !path.endsWith('/') && /\.(txt|md|json|js|ts|jsx|tsx|html|css|scss|py|java|go|rs|yaml|yml|xml|csv|log)$/i.test(path));
        const samples = [];
        for (const path of files.slice(0, 8)) {
            try { samples.push(`\n--- ${path} ---\n${await readText(path)}`); } catch (_) {}
        }
        return `\n\n[MODE WORK]\nDossier partagé : ${rootHandle.name}\nArborescence :\n${tree.join('\n')}\n${samples.join('\n')}\n[/MODE WORK]`;
    }
    function getInstructions() {
        if (!rootHandle || !settings.enabled) return '';
        const permission = settings.write
              ? 'Tu disposes de l autorisation d écriture. Quand l utilisateur demande de créer, modifier ou supprimer un fichier, tu DOIS produire la balise correspondante, et non expliquer que tu ne peux pas agir. Pour remplacer tout le fichier, utilise <work-write path="chemin/relatif">nouveau contenu complet</work-write>. Pour ajouter du texte à la fin sans supprimer le contenu existant, notamment « sur une nouvelle ligne », utilise obligatoirement <work-append path="chemin/relatif">texte nouveau uniquement</work-append> : ne recopie jamais le contenu déjà présent. Pour supprimer, utilise <work-delete path="chemin/relatif" />. Après la balise, indique brièvement l opération demandée.'
            : 'Le dossier est actuellement en lecture seule. Tu peux lire les fichiers, mais tu ne dois pas prétendre avoir écrit. Demande à l utilisateur d activer « Autoriser les écritures » pour modifier un fichier.';
        return `\n\n[CONTRAT WORK OBLIGATOIRE]\nDossier actif : ${rootHandle.name}. ${permission} Les chemins sont relatifs à la racine et ne doivent jamais contenir .. . Ne mets pas la balise dans un bloc de code.\n[/CONTRAT WORK]`;
    }
    async function applyOperations(text) {
        if (!rootHandle || !settings.write || !text) return [];
        const operations = [];
        const applied = [];
        const writeRe = /<work-write\s+path="([^"]+)">([\s\S]*?)<\/work-write>/gi;
            const appendRe = /<work-append\s+path="([^"]+)">([\s\S]*?)<\/work-append>/gi;
        const deleteRe = /<work-delete\s+path="([^"]+)"\s*\/>/gi;
        let match;
        while ((match = writeRe.exec(text))) operations.push({ type: 'write', path: match[1], content: match[2] });
            while ((match = appendRe.exec(text))) operations.push({ type: 'append', path: match[1], content: match[2] });
        while ((match = deleteRe.exec(text))) operations.push({ type: 'delete', path: match[1] });
        for (const operation of operations) {
            if (!isSafePath(operation.path)) continue;
            const question = operation.type === 'delete'
                ? `L'agent demande de supprimer ${operation.path}. Confirmer ?`
                : `L'agent demande d'écrire dans ${operation.path}. Appliquer ?`;
            if (!window.confirm(question)) continue;
            try {
                if (isDesktop()) {
                    let success;
                    if (operation.type === 'write') {
                        success = window.kiroDesktop.work.write(operation.path, operation.content);
                    } else if (operation.type === 'append') {
                        operation.requestedContent = operation.content;
                        const existing = window.kiroDesktop.work.read(operation.path) || '';
                        success = window.kiroDesktop.work.write(operation.path, `${existing}${existing && !existing.endsWith('\n') ? '\n' : ''}${operation.content}`);
                    } else {
                        success = window.kiroDesktop.work.remove(operation.path);
                    }
                    if (!success) throw new Error('Opération refusée');
                    applied.push(operation);
                    continue;
                }
                const parts = operation.path.split('/');
                const name = parts.pop();
                const directory = await getDirectory(rootHandle, parts, operation.type === 'write');
                if (operation.type === 'write' || operation.type === 'append') {
                    if (operation.type === 'append') {
                        operation.requestedContent = operation.content;
                        const existing = await readText(operation.path).catch(() => '');
                        operation.content = `${existing}${existing && !existing.endsWith('\n') ? '\n' : ''}${operation.content}`;
                    }
                    const handle = await directory.getFileHandle(name, { create: true });
                    const writable = await handle.createWritable();
                    await writable.write(operation.content);
                    await writable.close();
                } else await directory.removeEntry(name);
                applied.push(operation);
            } catch (error) { console.error('Work : opération refusée', error); }
        }
        if (applied.length) document.dispatchEvent(new CustomEvent('work-files-change'));
        return applied;
    }
    async function createReport(operations, modelId) {
        if (!Array.isArray(operations) || operations.length === 0) return '';
        const actions = operations.map(operation => `${operation.type === 'delete' ? 'suppression' : operation.type === 'append' ? 'ajout en fin de fichier' : 'modification'} de ${operation.path}`);
        const fallback = `C’est fait ! La demande a été exécutée : ${actions.join(' et ')}.`;
        if (!modelId || typeof streamText !== 'function') return fallback;
        try {
            const prompt = `Résume en français, en une seule phrase courte et professionnelle, l’action déjà exécutée par un assistant Work. Ne répète aucun contenu de fichier, ne cite pas le texte ajouté, ne donne aucune balise et ne commence pas par « Voici ». Actions : ${actions.join('; ')}. Réponds uniquement avec le résumé.`;
            const result = await streamText(modelId, prompt);
            const summary = result?.text?.replace(/[`*_#]/g, '').replace(/\s+/g, ' ').trim();
            if (summary && summary.length <= 220) return summary.endsWith('.') ? summary : `${summary}.`;
        } catch (error) { console.warn('Work : résumé IA indisponible', error); }
        return fallback;
    }
    window.WorkMode = {
        get enabled() { return !!rootHandle && settings.enabled; },
        get canWrite() { return !!rootHandle && settings.enabled && settings.write; },
        getConversationAccess() {
            if (!rootHandle || !settings.enabled) return null;
            return { name: rootHandle.name || settings.rootName || '', path: rootHandle.path || null };
        },
        restoreConversation(access) {
            rootHandle = null;
            settings.enabled = false;
            settings.rootName = '';
            if (access && isDesktop() && access.path) {
                const restored = window.kiroDesktop.work.setFolder(access.path);
                if (restored) {
                    rootHandle = restored;
                    settings.rootName = restored.name;
                    settings.enabled = true;
                }
            }
            saveSettings();
            render();
        },
        getPromptContext,
        getInstructions,
        listTree,
        readFile,
        applyOperations,
        createReport,
        toggleWrite() { settings.write = !settings.write; saveSettings(); render(); },
        clear() { rootHandle = null; settings.enabled = false; settings.rootName = ''; saveSettings(); render(); },
        chooseFolder
    };
    document.addEventListener('DOMContentLoaded', () => {
        const button = document.getElementById('work-btn');
        const panel = document.getElementById('work-panel');
        if (!button || !panel) return;
        button.addEventListener('click', () => { panel.hidden = false; render(); });
        document.getElementById('work-choose')?.addEventListener('click', chooseFolder);
        document.getElementById('work-write-toggle')?.addEventListener('change', async event => {
            if (!event.target.checked) {
                if (settings.write) window.WorkMode.toggleWrite();
                return;
            }
            if (!confirm('Autoriser l agent à proposer des écritures et suppressions ? Chaque opération demandera encore une confirmation.')) {
                event.target.checked = false;
                return;
            }
            try {
                if (isDesktop()) {
                    if (!rootHandle) throw new Error('Sélectionnez d’abord un dossier');
                    if (!settings.write) window.WorkMode.toggleWrite();
                    return;
                }
                if (!rootHandle || !rootHandle.requestPermission || await rootHandle.requestPermission({ mode: 'readwrite' }) !== 'granted') {
                    throw new Error('Permission d écriture non accordée');
                }
                if (!settings.write) window.WorkMode.toggleWrite();
            } catch (error) {
                event.target.checked = false;
                console.warn('Work : écriture désactivée', error);
            }
        });
        document.getElementById('work-close')?.addEventListener('click', () => { panel.hidden = true; });
        render();
    });
})();
