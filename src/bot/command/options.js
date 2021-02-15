const Command = require("./command");
const Logger = require("../../logger");
const YFinance = require("../source/yahoo");

function getOptionsChain(symbols) {
  Logger.log(`Get Options for symbols: '${symbols}'`);
  const results = [];
  const promises = [];
  for (const symbol of symbols) {
    const promise = YFinance.options({ symbol })
      .then((result) => {
        results.push({
          symbol,
          options: result,
        });
      })
      .catch((error) => {
        const msg = `Error doing news lookup: ${error.message}`;
        Logger.error(error, msg);
        throw new Error(msg);
      });
    promises.push(promise);
  }

  return Promise.all(promises).then(() => results);
}

module.exports = {
  /**
   * Attaches an options chain payload to a response
   *
   * @param {Boolean|Object} include
   */
  getOptionsChain: function attachNews(include) {
    return function newsAppender(result) {
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
          return getOptionsChain(includeSymbols).then((optionChain) => {
            return { ...result, optionChain };
          });
      }

      return result;
    };
  },
};
