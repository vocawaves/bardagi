const { ipcRenderer } = require('electron');
const keys = require('../../modules/keys');
const Store = require('electron-store');
const store = new Store({
  name: 'bardagi-config',
  fileExtension: 'bdgi',
  encryptionKey: keys.store,
  clearInvalidConfig: true,
});
const fs = require('fs');
const Danmaku = require('danmaku');
const styling = require('../../modules/styling');

const danmaku = new Danmaku({
  container: document.getElementById('comments'),
  comments: [],
  engine: 'canvas',
  speed: store.get('speed') || 144,
});

const getStyling = () => {
  let text, outline;
  const coloursMode = store.get('colours');

  const colours = styling.colours[coloursMode] || styling.colours[1];
  const styledata = colours[Math.floor(Math.random() * colours.length)];

  const fontSizeSetting = `[${store.get('fontSize')}]` || styling.sizes;
  const fontSize = JSON.parse(fontSizeSetting);

  switch (coloursMode) {
    case '1':
      text = `rgb(${Math.floor(Math.random() * 255)}, ${Math.floor(
        Math.random() * 255,
      )}, ${Math.floor(Math.random() * 255)})`;
      outline = `rgb(${Math.floor(Math.random() * 255)}, ${Math.floor(
        Math.random() * 255,
      )}, ${Math.floor(Math.random() * 255)})`;
      break;
    default:
      text = styledata.text;
      outline = styledata.outline;
  }

  const style = {
    font:
      fontSize[Math.floor(Math.random() * fontSize.length)] + 'px ' + store.get('font') ||
      'sans-serif',
    fillStyle: text,
  };

  const outlineSize = store.get('outlineSize') || 5;
  if (outlineSize !== 0) {
    style.strokeStyle = outline;
    style.lineWidth = outlineSize;
  }
  return style;
};

/* SAMPLE (LOCAL) */
ipcRenderer.on('sampleWindow', (_event, data) => {
  danmaku.emit({
    text: data,
    style: getStyling(),
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
        const styleData = getStyling();
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
        style: getStyling(),
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
        style: getStyling(),
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
        style: getStyling(),
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
        style: getStyling(),
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
          style: getStyling(),
        });
      });

      live.on('DANMU_MSG', (msg) => {
        danmaku.emit({
          text: msg.info[1],
          style: getStyling(),
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
