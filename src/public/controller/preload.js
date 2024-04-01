const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('store', {
  get(key) {
    return ipcRenderer.sendSync('electron-store-get', key);
  },
  set(property, val) {
    ipcRenderer.send('electron-store-set', property, val);
  },
});

contextBridge.exposeInMainWorld('main', {
  save: (data) => {
    ipcRenderer.send('save', data);
  },
  kill: () => {
    ipcRenderer.send('kill');
  },
  toggleMovement: () => {
    ipcRenderer.send('togglemovement');
  },
  clearComments: () => {
    ipcRenderer.send('clearcomments');
  },
  getFile: () => {
    return ipcRenderer.sendSync('openFile');
  }
});

contextBridge.exposeInMainWorld('styling', {
  sample: (data) => {
    ipcRenderer.send('sample', data);
  },
  save: (data) => {
    ipcRenderer.send('save', data);
  },
});

contextBridge.exposeInMainWorld('about', {
  openURL: (url) => {
    ipcRenderer.send('openURL', url);
  }
});
