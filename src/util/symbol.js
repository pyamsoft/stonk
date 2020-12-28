function symbolsToString(symbols) {
  return symbols
    .map((s) => s.trim())
    .map((s) => s.toUpperCase())
    .join(",");
}

module.exports = {
  symbolsToString,
};
