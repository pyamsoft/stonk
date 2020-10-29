const { newWatchList } = require("./model/watchlist");
const Logger = require("../logger");

const watchList = newWatchList();

function stopWatching(client, symbol) {
  watchList.stop(client, { symbol });
}

module.exports = {
  watchSymbol: function watchSymbol(
    client,
    { symbol, low, high, interval, command }
  ) {
    if (stopWatching(client, symbol)) {
      Logger.log("Cleared old watch interval for symbol: ", symbol);
    }
    watchList.start(client, { symbol, low, high, interval }, (s, l, h) =>
      command(s, l, h)
    );
  },
  stopWatchingSymbol: function stopWatchingSymbol(client, { symbol }) {
    stopWatching(client, symbol);
  },
  clearWatchList: function clearWatchList(client) {
    watchList.clear(client);
  },
};
