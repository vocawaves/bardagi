const { ipcRenderer } = require('electron');
const fs = require('fs');

const keys = require('../../modules/keys.js');
const Store = require('electron-store');
const store = new Store({
  name: 'bardagi-config',
  fileExtension: 'bdgi',
  encryptionKey: keys.store,
  clearInvalidConfig: true,
});

const Danmaku = require('danmaku');
const danmaku = new Danmaku({
  container: document.getElementById('comments'),
  comments: [],
  engine: 'canvas',
  speed: store.get('speed') || 144,
});

const getStyling = require('./assets/getStyling.js');

/* SAMPLE (LOCAL) */
ipcRenderer.on('sampleWindow', (_event, data) => {
  danmaku.emit({
    text: data,
    style: getStyling(store),
  });
});

let liveChat, client, tiktokLive, socket;
const init = () => {
  const started = new Date();
  const mode = store.get('mode');
  const identification = store.get('identification');

  if (mode === '1') {
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const dataPath = store.get('dataPath');

    if (dataPath) {
      const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
      data.forEach((comment) => {
        const styleData = getStyling(store);
        const toEmit = {
          text: comment.msg,
          style: comment.colour
            ? {
                font: styleData.font,
                strokeStyle: styleData.strokeStyle,
                lineWidth: styleData.lineWidth,
                fillStyle: comment.colour,
              }
            : styleData,
        };

        if (comment.time) {
          toEmit.time = comment.time;
          danmaku.emit(toEmit);
        } else {
          sleep(Math.floor(Math.random() * 8000)).then(() => {
            danmaku.emit(toEmit);
          });
        }
      });
    }
    /* SOCKET */
  } else if (mode === '2') {
    const io = require('socket.io-client');
    socket = io(identification);

    socket.on('message', (message) => {
      danmaku.emit({
        text: message,
        style: getStyling(store),
      });
    });

    /* YOUTUBE */
  } else if (mode === '3') {
    const { LiveChat } = require('youtube-chat');

    liveChat = new LiveChat({ liveId: identification });
    liveChat.start();

    liveChat.on('chat', (chatItem) => {
      if (new Date(chatItem.timestamp).getTime() < started.getTime()) {
        return;
      }

      danmaku.emit({
        text: chatItem.message[0].text,
        style: getStyling(store),
      });
    });
    /* TWITCH */
  } else if (mode === '4') {
    const { Client } = require('tmi.js');

    client = new Client({
      connection: {
        secure: true,
        reconnect: true,
      },
      channels: [identification],
    });

    client.connect();

    client.on('message', (_channel, _tags, message, self) => {
      if (self) {
        return;
      }

      danmaku.emit({
        text: message,
        style: getStyling(store),
      });
    });
    /* TIKTOK */
  } else if (mode === '5') {
    const { WebcastPushConnection } = require('tiktok-live-connector');

    tiktokLive = new WebcastPushConnection(identification);
    tiktokLive.connect();

    tiktokLive.on('chat', (chatItem) => {
      danmaku.emit({
        text: chatItem.comment,
        style: getStyling(store),
      });
    });
    /* BILIBILI */
  } else if (mode === '6') {
    const { LiveWS } = require('bilibili-live-ws');

    const live = new LiveWS(identification);

    live.on('live', () => {
      live.on('msg', (msg) => {
        danmaku.emit({
          text: msg.data.msg,
          style: getStyling(store),
        });
      });

      live.on('DANMU_MSG', (msg) => {
        danmaku.emit({
          text: msg.info[1],
          style: getStyling(store),
        });
      });
    });
  }
};

init();
const comments = document.getElementById('comments');
comments.style.opacity = store.get('opacity') || 1;

ipcRenderer.on('saveWindow', (_event, data) => {
  /* cleanup */
  if (data.type === 'config') {
    if (data.mode !== '2' && socket) {
      socket.disconnect();
    } else if (data.mode !== '3' && liveChat) {
      liveChat.stop();
    } else if (data.mode !== '4' && client) {
      client.disconnect();
    }

    danmaku.clear();

    /* re-init */
    init();
  } else if (data.type === 'styling') {
    danmaku.speed = data.speed;
    comments.style.opacity = data.opacity;
  }
});

ipcRenderer.on('togglemovement', (_event, data) => {
  if (data.movement === true) {
    document.body.classList.add('movement');
    comments.style.width = data.width - 100 + 'px';
    comments.style.height = data.height - 100 + 'px';
  } else {
    document.body.classList.remove('movement');
    danmaku.resize();
  }
});

ipcRenderer.on('clearcomments', (_event, data) => {
  danmaku.clear();
});
