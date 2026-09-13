const { contextBridge, ipcRenderer } = require('electron');

// API synchrone volontairement minimale : elle remplace les deux stockages
// navigateur utilisés par l'interface sans modifier ses appels existants.
contextBridge.exposeInMainWorld('kiroDesktop', {
    isDesktop: true,
    storage: {
        getItem: key => ipcRenderer.sendSync('kiro-storage-get', key),
        setItem: (key, value) => ipcRenderer.sendSync('kiro-storage-set', key, String(value)),
        removeItem: key => ipcRenderer.sendSync('kiro-storage-remove', key),
        clear: () => ipcRenderer.sendSync('kiro-storage-clear')
    },
    conversations: {
        list: () => ipcRenderer.sendSync('kiro-conversation-list'),
        read: name => ipcRenderer.sendSync('kiro-conversation-read', name),
        write: (name, value) => ipcRenderer.sendSync('kiro-conversation-write', name, value)
    },
    work: {
        chooseFolder: () => ipcRenderer.sendSync('kiro-work-choose'),
        setFolder: directory => ipcRenderer.sendSync('kiro-work-set', directory),
        list: () => ipcRenderer.sendSync('kiro-work-list'),
        read: relativePath => ipcRenderer.sendSync('kiro-work-read', relativePath),
        write: (relativePath, content) => ipcRenderer.sendSync('kiro-work-write', relativePath, content),
        remove: relativePath => ipcRenderer.sendSync('kiro-work-delete', relativePath)
    }
});
