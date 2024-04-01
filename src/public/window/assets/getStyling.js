const styling = require('../../../modules/styling.js');

module.exports = (store) => {
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
