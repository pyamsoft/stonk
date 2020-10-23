const YFinance = require("./yahoo");
const { asArray } = require("../../util/array");
const { symbolsToString } = require("../../util/symbol");
const Logger = require("../../logger");

const DataSource = YFinance;

module.exports = {
  lookup: function lookup({ symbols: symbolOrSymbols }) {
    const symbols = asArray(symbolOrSymbols);
    Logger.log("Lookup for symbols: ", symbols);
    return DataSource.lookup({ symbols })
      .then((data) => {
        Logger.log("Lookup results: ", JSON.stringify(data));
        return {
          symbols,
          data,
        };
      })
      .catch((error) => {
        const string = symbolsToString(symbols);
        const msg = `Error looking up symbols: \$${string}`;
        Logger.error(error, msg);
        throw new Error(msg);
      });
  },
};
