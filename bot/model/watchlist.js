const Logger = require("../../logger");

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
      Logger.log("Clear interval for symbol:", symbol);
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
      Logger.log(
        "Begin watching symbol at interval(minutes) ",
        symbol,
        low,
        high,
        interval
      );

      setEntry(
        symbol,
        low,
        high,
        stopwatch.setInterval(() => {
          const entry = watchList[symbol];
          if (!entry) {
            Logger.warn(
              "WatchList interval found no entry for symbol: ",
              symbol
            );
            return;
          }

          const { low, high } = entry;
          onInterval(symbol, low, high);
        }, interval * 60 * 1000)
      );
    },
    passedLow: function passedLow(stopwatch, { symbol }) {
      const entry = getEntry(symbol);
      const { low, high, interval } = entry;
      if (low) {
        Logger.log("Symbol passed low point: ", symbol, low);
        setEntry(symbol, null, high, interval);
      } else if (!low && !high) {
        stopWatching(stopwatch, symbol);
      }
    },
    passedHigh: function passedHigh(stopwatch, { symbol }) {
      const entry = getEntry(symbol);
      const { low, high, interval } = entry;
      if (high) {
        Logger.log("Symbol passed high point: ", symbol, high);
        setEntry(symbol, low, null, interval);
      } else if (!low && !high) {
        stopWatching(stopwatch, symbol);
      }
    },
    stop: function stop(stopwatch, { symbol }) {
      Logger.log("Stop watching symbol: ", symbol);
      return stopWatching(stopwatch, symbol);
    },
    clear: function clear(stopwatch) {
      Logger.log("Clear watch list");
      for (const symbol of Object.keys(watchList)) {
        stopWatching(stopwatch, symbol);
      }
    },
  };
}

module.exports = {
  create: newWatchList,
};
