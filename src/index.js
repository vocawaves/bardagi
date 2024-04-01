require('v8-compile-cache');

const debug = false;

const electron = require('electron');
const { app, BrowserWindow, screen, ipcMain, Tray, Menu, dialog, shell } = electron;

const keys = require('./modules/keys');
const Store = require('electron-store');
const store = new Store({
  name: 'bardagi-config',
  fileExtension: 'bdgi',
  encryptionKey: keys.store,
  clearInvalidConfig: true,
});
//const ipcValidator = require('./modules/ipcValidator');

// https://www.electronjs.org/docs/latest/tutorial/performance#8-call-menusetapplicationmenunull-when-you-do-not-need-a-default-menu
Menu.setApplicationMenu(null);

// https://www.electronjs.org/de/docs/latest/api/command-line-switches#--force_high_performance_gpu
app.commandLine.appendSwitch('force_high_performance_gpu');

/* ACTUAL APPLICATION */
let window, controller;
let movement = false;

const createController = () => {
  /* CONTROLLER */
  controller = new BrowserWindow({
    width: 800,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: `${__dirname}/public/controller/preload.js`,
    },
    resizable: debug,
    maximizable: false,
    icon: `${__dirname}/public/assets/icon.png`,
  });

  controller.loadURL(`file://${__dirname}/public/controller/status.html`);
  controller.webContents.session.enableNetworkEmulation({ offline: true });
  if (debug) {
    controller.webContents.openDevTools();
  }

  controller.on('close', (e) => {
    controller.destroy();
    controller = null;
  });
};

const createWindow = () => {
  /* MAIN DISPLAY */
  const { workAreaSize } = screen.getPrimaryDisplay();

  window = new BrowserWindow({
    width: workAreaSize.width - 1,
    height: workAreaSize.height - 1,
    transparent: true,
    frame: false,
    focusable: false,
    fullscreen: !debug,
    skipTaskbar: !debug,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  if (debug) {
    window.webContents.openDevTools();
  } else {
    window.setAlwaysOnTop(true, 'level');
  }

  window.loadURL(`file://${__dirname}/public/window/index.html`);
  window.webContents.session.enableNetworkEmulation({ offline: true });

  window.on('show', () => {
    window.setSize(workAreaSize.width, workAreaSize.height);
    window.center();

    // load position
    const bounds = store.get('bounds');
    if (bounds) {
      window.setBounds(bounds);
    }
  });

  window.on('hide', () => {
    window.setSize(workAreaSize.width - 1, workAreaSize.height - 1);
  });

  window.once('ready-to-show', () => {
    window.show();
  });

  window.on('move', () => {
    const bounds = window.getBounds();
    const currentDisplay = screen.getDisplayNearestPoint({ x: bounds.x, y: bounds.y });
    const { workAreaSize } = currentDisplay;
    const mouse = screen.getCursorScreenPoint();
    const edgeDistance = 10; // distance from edge in pixels
    const screenWidth = screen.getPrimaryDisplay().size.width;
    const screenHeight = screen.getPrimaryDisplay().size.height;

    if (
      mouse.x <= edgeDistance ||
      mouse.x >= screenWidth - edgeDistance ||
      mouse.y <= edgeDistance ||
      mouse.y >= screenHeight - edgeDistance
    ) {
      window.setSize(workAreaSize.width, workAreaSize.height);
      window.center();
    } else if (currentDisplay !== screen.getPrimaryDisplay()) {
      window.setSize(workAreaSize.width - 1, workAreaSize.height - 1);
    }
  });

  if (process.platform === 'win32') {
    window.hookWindowMessage(0x0116, () => {
      window.setEnabled(false);
      window.setEnabled(true);
    });
  }

  window.on('moved', () => {
    const winBounds = window.getBounds();
    store.set('bounds', winBounds);
  });

  // click-through
  if (!debug) {
    window.setIgnoreMouseEvents(true);
    window.setFocusable(false);
  }
};

// prevent electron killing the app when all windows are closed
app.on('window-all-closed', (e) => {
  e.preventDefault();
});

// prevent multiple instances of the app
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

app.on('ready', () => {
  /* TRAY */
  const tray = new Tray(`${__dirname}/public/assets/icon.png`);
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show Controller', click: () => createController() },
    { type: 'separator' },
    { label: 'Exit', click: () => app.quit() },
  ]);
  tray.setToolTip('Bardagi');
  tray.setContextMenu(contextMenu);
  tray.on('click', () => {
    createController();
  });

  /* MAIN DISPLAY */
  createWindow();

  /* CONTROLLER */
  if (debug) {
    createController();
  }
});

/* IPC */
ipcMain.on('save', (event, data) => {
  // if (!ipcValidator(event.senderFrame)) return;
  store.set(data);
  if (window !== null) {
    window.webContents.send('saveWindow', data);
  }
});

ipcMain.on('sample', (event, data) => {
  // if (!ipcValidator(event.senderFrame)) return;
  if (window !== null) {
    window.webContents.send('sampleWindow', data);
  }
});

ipcMain.on('kill', (event) => {
  // if (!ipcValidator(event.senderFrame)) return;
  if (window !== null) {
    window.destroy();
    window = null;
  } else {
    createWindow();
  }
});

ipcMain.on('openURL', (event, data) => {
  // if (!ipcValidator(event.senderFrame)) return;
  // todo: limit this
  shell.openExternal(data);
});

ipcMain.on('togglemovement', (event) => {
  if (movement === false) {
    movement = true;
    window.setIgnoreMouseEvents(false);
    window.webContents.send('togglemovement', { movement: true });
  } else {
    movement = false;
    window.setIgnoreMouseEvents(true);
    window.webContents.send('togglemovement', { movement: false });
  }
});

ipcMain.on('clearcomments', (event) => {
  // if (!ipcValidator(event.senderFrame)) return;
  window.webContents.send('clearcomments');
});

ipcMain.on('electron-store-get', async (event, val) => {
  // if (!ipcValidator(event.senderFrame)) return;
  event.returnValue = store.get(val);
});

ipcMain.on('electron-store-set', async (event, key, val) => {
  // if (!ipcValidator(event.senderFrame)) return;
  store.set(key, val);
});

ipcMain.on('openFile', (event, data) => {
  dialog
    .showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Comment Data', extensions: ['json'] }],
    })
    .then((result) => {
      if (!result.canceled) {
        event.returnValue = result.filePaths[0];
      }
    });
});
