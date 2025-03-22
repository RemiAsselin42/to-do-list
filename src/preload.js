const { contextBridge, ipcRenderer } = require('electron');

// Expose une API sécurisée au renderer process
contextBridge.exposeInMainWorld('todoAPI', {
    // Fonctions pour les tâches
    getTasks: () => ipcRenderer.invoke('getTasks'),
    saveTasks: (tasks) => ipcRenderer.invoke('saveTasks', tasks),
    onTasksUpdated: (callback) => ipcRenderer.on('tasks-updated', (_, tasks) => callback(tasks)),

    // Fonctions pour les catégories
    getCategories: () => ipcRenderer.invoke('getCategories'),
    saveCategories: (categories) => ipcRenderer.invoke('saveCategories', categories),
    onCategoriesUpdated: (callback) => ipcRenderer.on('categories-updated', (_, categories) => callback(categories)),

    // Fonctions pour le contrôle de la fenêtre
    minimizeWindow: () => ipcRenderer.invoke('window-minimize'),
    maximizeWindow: () => ipcRenderer.invoke('window-maximize'),
    closeWindow: () => ipcRenderer.invoke('window-close')
});
