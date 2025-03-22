const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const Store = require('electron-store').default || require('electron-store');

// Stockage persistant des tâches
const store = new Store();

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    frame: false, // Fenêtre sans bordure
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Désactiver le menu par défaut
  mainWindow.setMenu(null);
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(() => {
  // Gérer les interactions IPC
  ipcMain.handle('getTasks', () => store.get('tasks', []));
  ipcMain.handle('getCategories', () => store.get('categories', []));

  ipcMain.handle('saveCategories', (_, categories) => {
    store.set('categories', categories);

    // Notifier tous les fenêtres que les catégories ont été modifiées
    BrowserWindow.getAllWindows().forEach(win => {
      win.webContents.send('categories-updated', categories);
    });

    return true;
  });

  ipcMain.handle('saveTasks', (_, tasks) => {
    store.set('tasks', tasks);

    // Notifier tous les ouverts que les tâches ont été modifiées
    BrowserWindow.getAllWindows().forEach(win => {
      win.webContents.send('tasks-updated', tasks);
    });

    return true;
  });

  ipcMain.handle('window-minimize', () => {
    BrowserWindow.getFocusedWindow().minimize();
  });

  ipcMain.handle('window-maximize', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  });

  ipcMain.handle('window-close', () => {
    BrowserWindow.getFocusedWindow().close();
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});