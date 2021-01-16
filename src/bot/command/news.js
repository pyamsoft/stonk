const Command = require("./command");
const Logger = require("../../logger");
const GoogleNews = require("../source/google");

function lookupNews(symbols, addStockToQuery) {
  Logger.log(`Perform news for symbols: '${symbols}'`);
  return GoogleNews.news({ symbols, addStockToQuery }).catch((error) => {
    const msg = `Error doing news lookup: ${error.message}`;
    Logger.error(error, msg);
    throw new Error(msg);
  });
}

module.exports = {
  /**
   * Attaches a news payload to a given response
   *
   * @param {Boolean|Object} include
   * @param {Boolean} addStockToQuery
   */
  AttachNews: function AttachNews(include, addStockToQuery) {
    return function NewsAppender(result) {
      if (result.symbols) {
        let includeSymbols = [];

        // Include news if true or symbol contained in news object payload
        if (include === true) {
          includeSymbols = result.symbols;
        } else if (typeof include === Command.TYPE_OBJECT) {
          for (const symbol of Object.keys(include)) {
            if (include[symbol]) {
              includeSymbols.push(symbol);
            }
          }
        }

        if (includeSymbols.length > 0)
          return lookupNews(includeSymbols, addStockToQuery).then((news) => {
            return { ...result, news };
          });
      }

      return result;
    };
  },
};
