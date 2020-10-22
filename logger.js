const isDebug = process.env.BOT_ENV !== "production";

function log(...args) {
  if (isDebug) {
    console.log(...args);
  }
}

function warn(...args) {
  if (isDebug) {
    console.warn(...args);
  }
}

function error(e, ...args) {
  console.error(e, ...args);
}

module.exports = {
  log,
  warn,
  error,
};
