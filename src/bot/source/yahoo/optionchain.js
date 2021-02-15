const Logger = require("../../../logger");
const { jsonApi } = require("../../../util/api");
const { newOptionChain } = require("../../model/optionchain");

const logger = Logger.tag("bot/source/yahoo/optionchain");

function generateOptionsUrl(symbol) {
  const params = new URLSearchParams();
  params.append("formatted", "true");
  return `https://query1.finance.yahoo.com/v7/finance/options/${symbol}?${params.toString()}`;
}

module.exports = {
  optionChain: function optionChain(symbol) {
    logger.log("Lookup option chain for: ", symbol);
    return jsonApi(generateOptionsUrl(symbol)).then((data) => {
      const { optionChain } = data;
      const { result } = optionChain;
      for (const entry of result) {
        const { underlyingSymbol, options } = entry;
        if (underlyingSymbol !== symbol) {
          logger.warn("Options do not match", underlyingSymbol, symbol);
          return null;
        }

        return newOptionChain(options);
      }
    });
  },
};
