const News = require("./news");
const Command = require("./command");
const Help = require("./help");
const Logger = require("../../logger");
const { asArray } = require("../../util/array");
const { symbolsToString } = require("../../util/symbol");
const YFinance = require("../source/yahoo");

function lookupSymbols(symbols) {
  Logger.log(`Perform lookup for symbols: ${symbols}`);
  const symbolList = asArray(symbols);
  return YFinance.lookup({ symbols: symbolList }).catch((error) => {
    const string = symbolsToString(symbolList);
    const msg = `Error looking up symbols: ${string}`;
    Logger.error(error, msg);
    throw new Error(msg);
  });
}

module.exports = function Lookup(
  symbols,
  prefix,
  id,
  respond,
  { includeNews, watchSymbols, stopWatchSymbols }
) {
  if (!symbols || symbols.length <= 0) {
    Help.printHelp(prefix, id, respond);
    return;
  }

  Command.process(
    id,
    lookupSymbols(symbols)
      .then(News.AttachNews(includeNews, true))
      .then((result) => {
        return {
          result,
          extras: { watchSymbols, stopWatchSymbols },
        };
      }),
    respond
  );
};
