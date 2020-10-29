const Logger = require("../logger");

const watchList = {};

function stopWatchingSymbol(client, symbol) {
  Logger.log("Stop watching symbol for prices: ", symbol);
  for (const entry of Object.keys(watchList)) {
    if (entry === symbol) {
      const interval = watchList[entry];
      if (interval) {
        Logger.log("Clear interval for symbol:", entry);
        client.clearInterval(interval);
        watchList[entry] = null;
        return true;
      }
    }
  }

  return false;
}

module.exports = {
  watchSymbol: function watchSymbol(
    client,
    { symbol, low, high, interval, command }
  ) {
    if (stopWatchingSymbol(client, { symbol })) {
      Logger.log("Cleared old watch interval for symbol: ", symbol);
    }

    Logger.log(
      "Begin watching symbol for prices at interval(minutes) ",
      symbol,
      low,
      high,
      interval
    );
    watchList[symbol] = client.setInterval(command, interval * 60 * 1000);
  },
  stopWatchingSymbol,
  clearWatchList: function clearWatchList(client) {
    Logger.log("Clear watch list");
    for (const symbol of Object.keys(watchList)) {
      const interval = watchList[symbol];
      if (interval) {
        client.clearInterval(interval);
        watchList[symbol] = null;
      }
    }
  },
};
