const Logger = require("../../../logger");
const { jsonApi } = require("../../../util/api");

function generateOptionsUrl(symbol) {
  const params = new URLSearchParams();
  params.append("formatted", "true");
  return `https://query1.finance.yahoo.com/v7/finance/options/${symbol}?${params.toString()}`;
}

module.exports = {
  optionChain: function optionChain(symbol) {
    return jsonApi(generateOptionsUrl(symbol)).then((data) => {
      const { optionChain } = data;
      const { result } = optionChain;
      for (const entry of result) {
        const { underlyingSymbol, options } = entry;
        if (underlyingSymbol !== symbol) {
          Logger.warn("Options do not match", underlyingSymbol, symbol);
          return null;
        }

        for (const option of options) {
          const { expirationDate, calls, puts } = option;
          for (const call of calls) {
            Logger.log(call, expirationDate);
          }

          for (const put of puts) {
            Logger.log(put, expirationDate);
          }
        }
      }
    });
  },
};
