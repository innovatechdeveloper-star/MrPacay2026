// ====================================================================
// PRELOAD SCRIPT - Sistema Etiquetas v2.5
// ====================================================================
// Puente seguro de comunicación entre main process y renderer process
// ====================================================================

const { contextBridge, ipcRenderer } = require('electron');

// Exponer API segura para la ventana de logs
contextBridge.exposeInMainWorld('electronAPI', {
    // Escuchar nuevos logs
    onNewLog: (callback) => {
        ipcRenderer.on('new-log', (event, data) => callback(data));
    },
    
    // Cargar logs iniciales
    loadInitialLogs: () => {
        ipcRenderer.send('load-initial-logs');
    }
});
