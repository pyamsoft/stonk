const Parser = require("./parser");
const YFinance = require("./yahoo");
const { asArray } = require("../util/array");
const { symbolsToString } = require("../util/symbol");

module.exports = {
  lookup: ({ symbols: symbolOrSymbols }, reply) => {
    const symbols = asArray(symbolOrSymbols);
    YFinance.lookup({ symbols })
      .then((data) => {
        const parsed = Parser.parse({
          symbols,
          data,
        });
        reply({
          message: parsed,
          isError: false,
        });
      })
      .catch((error) => {
        const string = symbolsToString(symbols);
        console.error(error, `Error looking up symbols: ${string}`);
        reply({
          message: `Error looking up symbols: \$${string}`,
          isError: true,
        });
      });
  },
};
