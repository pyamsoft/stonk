const WatchList = require("./model/watchlist");
const Logger = require("../logger");

const watchList = WatchList.create();

function stopWatching(stopwatch, symbol) {
  watchList.stop(stopwatch, { symbol });
}

module.exports = {
  watchSymbol: function watchSymbol(
    stopwatch,
    { symbol, low, high, interval, command }
  ) {
    if (stopWatching(stopwatch, symbol)) {
      Logger.log("Cleared old watch interval for symbol: ", symbol);
    }
    watchList.start(stopwatch, { symbol, low, high, interval }, (s, l, h) =>
      command(s, l, h)
    );
  },
  markLowPassed: function markLowPassed(stopwatch, { symbol }) {
    return watchList.passedLow(stopwatch, { symbol });
  },
  markHighPassed: function markHighPassed(stopwatch, { symbol }) {
    return watchList.passedHigh(stopwatch, { symbol });
  },
  stopWatchingSymbol: function stopWatchingSymbol(stopwatch, { symbol }) {
    stopWatching(stopwatch, symbol);
  },
  clearWatchList: function clearWatchList(stopwatch) {
    watchList.clear(stopwatch);
  },
};
