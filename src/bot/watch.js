const WatchList = require("./model/watchlist");

const watchList = WatchList.create();

module.exports = {
  watchSymbol: function watchSymbol({ symbol, low, high, interval, command }) {
    watchList.stop({ symbol });
    watchList.start({ symbol, low, high, interval }, (s, l, h) =>
      command(s, l, h)
    );
  },
  markLowPassed: function markLowPassed({ symbol }) {
    return watchList.passedLow({ symbol });
  },
  markHighPassed: function markHighPassed({ symbol }) {
    return watchList.passedHigh({ symbol });
  },
  stopWatchingSymbol: function stopWatchingSymbol({ symbol }) {
    watchList.stop({ symbol });
  },
  clearWatchList: function clearWatchList() {
    watchList.clear();
  },
};
