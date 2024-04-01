document.getElementById('save').addEventListener('click', () => {
  const mode = document.querySelector('input[name="mode"]:checked').value;

  main.save({
    mode,
    enabled: document.getElementById('enable').checked,
    identification: document.getElementById('identification').value,
    dataPath: document.getElementById('filename').innerText,
    type: 'config',
  });
});

document.getElementById('openfile').addEventListener('click', () => {
  let dataPath = main.getFile();
  if (dataPath) {
    document.getElementById('filename').innerText = dataPath;
  }
});

document.getElementById('clearfile').addEventListener('click', () => {
  document.getElementById('filename').innerText = 'No file selected';
});

const kill = document.getElementById('kill');
const togglemovement = document.getElementById('togglemovement');
kill.addEventListener('click', () => {
  if (kill.innerText === 'Kill') {
    kill.innerText = 'Start';
  } else {
    kill.innerText = 'Kill';
  }
  main.kill();
  togglemovement.classList.remove('movementactive');
});

const mode = store.get('mode');
switch (mode) {
  case '2':
    document.getElementById('socket').checked = true;
    break;
  case '3':
    document.getElementById('youtube').checked = true;
    break;
  case '4':
    document.getElementById('twitch').checked = true;
    break;
  case '5':
    document.getElementById('tiktok').checked = true;
    break;
  case '6':
    document.getElementById('bilibili').checked = true;
    break;
  case '1':
  default:
    document.getElementById('local').checked = true;
    document.getElementById('localfile').style.display = 'block';
    document.getElementById('filename').innerText = store.get('dataPath') || 'No file selected';

}

document.getElementById('enable').checked = store.get('enabled');

const identification = store.get('identification');
if (identification) {
  document.getElementById('identification').value = identification;
}

togglemovement.addEventListener('click', () => {
  togglemovement.classList.toggle('movementactive');
  main.toggleMovement();
});

const clearcomments = document.getElementById('clearcomments');
clearcomments.addEventListener('click', () => {
  main.clearComments();
});