const Logger = require("../../logger");

const logger = Logger.tag("bot/model/watchlist");

function newWatchList() {
  const watchList = {};

  function getEntry(symbol) {
    const entry = watchList[symbol];
    return entry || {};
  }

  function setEntry(symbol, low, high, interval) {
    watchList[symbol] = {
      low,
      high,
      interval,
    };
  }

  function stopWatching(stopwatch, symbol) {
    const { interval } = getEntry(symbol);
    if (interval) {
      logger.log("Stop watching for symbol:", symbol);
      stopwatch.clearInterval(interval);
      watchList[symbol] = null;
      return true;
    }

    return false;
  }

  return {
    start: function start(
      stopwatch,
      { symbol, low, high, interval },
      onInterval
    ) {
      logger.log("Begin watching", symbol, low, high, interval);
      setEntry(
        symbol,
        low,
        high,
        stopwatch.setInterval(() => {
          const entry = getEntry(symbol);
          const { low, high } = entry;
          if (!low && !high) {
            logger.log("Watch is complete, no points exist");
          } else {
            onInterval(symbol, low, high);
          }
        }, interval * 1000)
      );

      // Run it immediately
      onInterval(symbol, low, high);
    },
    passedLow: function passedLow(stopwatch, { symbol }) {
      const entry = getEntry(symbol);
      const { low, high, interval } = entry;
      if (low) {
        logger.log("Symbol passed low point: ", symbol, low);
        setEntry(symbol, null, high, interval);
      } else if (!low && !high) {
        stopWatching(stopwatch, symbol);
      }
    },
    passedHigh: function passedHigh(stopwatch, { symbol }) {
      const entry = getEntry(symbol);
      const { low, high, interval } = entry;
      if (high) {
        logger.log("Symbol passed high point: ", symbol, high);
        setEntry(symbol, low, null, interval);
      } else if (!low && !high) {
        stopWatching(stopwatch, symbol);
      }
    },
    stop: function stop(stopwatch, { symbol }) {
      return stopWatching(stopwatch, symbol);
    },
    clear: function clear(stopwatch) {
      for (const symbol of Object.keys(watchList)) {
        stopWatching(stopwatch, symbol);
      }
    },
  };
}

module.exports = {
  create: newWatchList,
};
