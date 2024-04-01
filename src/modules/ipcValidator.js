module.exports = (frame) => {
  if (frame.url.startsWith('file://')) return true;
  return false;
};
