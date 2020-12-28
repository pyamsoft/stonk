const isDebug = process.env.BOT_ENV !== "production";

function print(...args) {
  console.log(...args);
}

function log(...args) {
  if (isDebug) {
    print(...args);
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
  print,
  log,
  warn,
  error,
};
