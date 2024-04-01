document.getElementById('font-size').value = store.get('font-size') || '25, 30, 50';

const colours = store.get('colours');
switch (colours) {
  case '1':
    document.getElementById('rgb').checked = true;
    break;
  case '2':
  default:
    document.getElementById('niconico').checked = true;
    break;
}

document.getElementById('outline-size').value = store.get('outlineSize') || 5;
document.getElementById('speed').value = store.get('speed') || 144;
document.getElementById('font').value = store.get('font') || 'sans-serif';

document.getElementById('save').addEventListener('click', () => {
  styling.save({
    fontSize: document.getElementById('font-size').value,
    colours: document.querySelector('input[name="colours"]:checked').value,
    outlineSize: document.getElementById('outline-size').value,
    speed: document.getElementById('speed').value,
    font: document.getElementById('font').value,
    opacity: document.getElementById('opacity').value / 100,
    type: 'styling',
  });
});

document.getElementById('reset').addEventListener('click', () => {
  document.getElementById('font-size').value = '25, 30, 50';
  document.getElementById('rgb').checked = false;
  document.getElementById('niconico').checked = true;
  document.getElementById('outline-size').value = 5;
  document.getElementById('speed').value = 144;
  document.getElementById('font').value = 'sans-serif';
  document.getElementById('opacity').value = 1;

  styling.save({
    fontSize: document.getElementById('font-size').value,
    colours: document.querySelector('input[name="colours"]:checked').value,
    outlineSize: document.getElementById('outline-size').value,
    speed: document.getElementById('speed').value,
    font: document.getElementById('font').value,
    opacity: document.getElementById('opacity').value / 100,
    type: 'styling',
  });
});

const opacity = store.get('opacity');
if (opacity) {
  document.getElementById('opacity').value = opacity * 100;
  document.getElementById('opacityValue').innerText = opacity * 100;
} else {
  document.getElementById('opacity').value = 1;
  document.getElementById('opacityValue').innerText = 1;
}

document.getElementById('opacity').addEventListener('input', () => {
  document.getElementById('opacityValue').innerText = document.getElementById('opacity').value;
});
