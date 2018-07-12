import { app, BrowserWindow, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\');
}

let mainWindow;
const winURL = process.env.NODE_ENV === 'development'
  ? 'http://localhost:9080'
  : `file://${__dirname}/index.html`;

function createWindow() {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    frame: false,
    height: 768,
    useContentSize: true,
    width: 1366,
  });

  mainWindow.loadURL(winURL);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdatesAndNotify();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

/**
 * 边框
 */
// 窗口最小化
ipcMain.on('min-window', () => {
  mainWindow.minimize();
});
// 窗口最大化
ipcMain.on('max-window', () => {
  if (mainWindow.isMaximized()) {
    mainWindow.restore();
  } else {
    mainWindow.maximize();
  }
});
// 关闭
ipcMain.on('close-window', () => {
  mainWindow.close();
});

/**
 * 下载
 */
ipcMain.on('download', (event, downloadPath) => {
  mainWindow.webContents.downloadURL(downloadPath);
  mainWindow.webContents.session.once('will-download', (event, item) => {
    item.once('done', (event, state) => {
      // 成功的话 state为completed 取消的话 state为cancelled
      mainWindow.webContents.send('downstate', state);
    });
  });
});


/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall();
});
