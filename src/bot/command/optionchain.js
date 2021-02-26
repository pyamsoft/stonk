const Logger = require("../../logger");
const TDAmeritrade = require("../source/td");

const logger = Logger.tag("bot/command/optionchain");

function optionsChain(symbols, weekOffset) {
  const results = {};
  const promises = [];
  for (const symbol of symbols) {
    const offset = weekOffset ? weekOffset[symbol] : null;
    const offsetValue = offset ? offset.weekOffset : 0;
    logger.log(`Get Options for symbol: '${symbol}' (offset: ${offsetValue})`);
    const promise = TDAmeritrade.optionChain({
      symbol,
      weekOffset: offsetValue,
    })
      .then((result) => {
        results[symbol] = result;
      })
      .catch((error) => {
        const msg = `Error doing options lookup: ${error.message}`;
        logger.error(error, msg);
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
  getOptionsChain: function getOptionsChain(include) {
    return function optionsAppender(result) {
      if (result.symbols) {
        let includeSymbols = [];
        let weekOffsets = {};

        // Include option chain if symbol contained in options object payload
        for (const symbol of Object.keys(include)) {
          const weekOffset = include[symbol];
          if (weekOffset !== undefined && weekOffset !== null) {
            includeSymbols.push(symbol);
            weekOffsets[symbol] = weekOffset;
          }
        }

        if (includeSymbols.length > 0) {
          return optionsChain(includeSymbols, weekOffsets).then(
            (optionChain) => {
              return { ...result, optionChain };
            }
          );
        }
      }

      return result;
    };
  },
};
