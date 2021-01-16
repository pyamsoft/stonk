const News = require("./news");
const Command = require("./command");
const Help = require("./help");
const Logger = require("../../logger");
const YFinance = require("../source/yahoo");

function reverseLookupSymbols(query, fuzzy) {
  Logger.log(`Perform query for string: '${query}'`);
  return YFinance.reverseLookup({ query, fuzzy }).catch((error) => {
    const msg = `Error doing reverse lookup: ${error.message}`;
    Logger.error(error, msg);
    throw new Error(msg);
  });
}

/**
 * Perform a reverse lookup - given a query, generate a symbol
 *
 * @param {String} query
 * @param {String} prefix
 * @param {String} id
 * @param {Function} respond
 * @param {Object} options
 */
module.exports = function reverse(
  query,
  prefix,
  id,
  respond,
  { includeNews, watchSymbols, stopWatchSymbols }
) {
  if (!query || query.length <= 0) {
    Help.printHelp(prefix, id, respond);
    return;
  }

  Command.process(
    id,
    reverseLookupSymbols(query, true)
      .then(News.attachNews(includeNews, true))
      .then((result) => {
        // Turn the watchSymbols payload into the expected format
        if (result.symbols) {
          const [symbol] = result.symbols;
          if (symbol) {
            const correctWatchSymbols = {};
            correctWatchSymbols[symbol] = watchSymbols;
            const correctStopWatchSymbols = {};
            correctStopWatchSymbols[symbol] = stopWatchSymbols;
            return {
              result,
              extras: {
                watchSymbols: correctWatchSymbols,
                stopWatchSymbols: correctStopWatchSymbols,
              },
            };
          }
        }

        return {
          result,
          extras: Command.EMPTY_OBJECT,
        };
      }),
    respond
  );
};
