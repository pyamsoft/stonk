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

  function stopWatching(client, symbol) {
    const { interval } = getEntry(symbol);
    if (interval) {
      Logger.log("Clear interval for symbol:", symbol);
      client.clearInterval(interval);
      watchList[symbol] = null;
      return true;
    }

    return false;
  }

  return {
    start: function start(client, { symbol, low, high, interval }, onInterval) {
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
        client.setInterval(() => {
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
    passedLow: function passedLow(client, { symbol }) {
      const entry = getEntry(symbol);
      const { low, high, interval } = entry;
      if (low) {
        Logger.log("Symbol passed low point: ", symbol, low);
        setEntry(symbol, null, high, interval);
      } else if (!low && !high) {
        stopWatching(client, symbol);
      }
    },
    passedHigh: function passedHigh(client, { symbol }) {
      const entry = getEntry(symbol);
      const { low, high, interval } = entry;
      if (high) {
        Logger.log("Symbol passed high point: ", symbol, high);
        setEntry(symbol, low, null, interval);
      } else if (!low && !high) {
        stopWatching(client, symbol);
      }
    },
    stop: function stop(client, { symbol }) {
      Logger.log("Stop watching symbol: ", symbol);
      return stopWatching(client, symbol);
    },
    clear: function clear(client) {
      Logger.log("Clear watch list");
      for (const symbol of Object.keys(watchList)) {
        stopWatching(client, symbol);
      }
    },
  };
}

module.exports = {
  newWatchList,
};
