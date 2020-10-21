const Parser = require("./parser");
const YFinance = require("./yahoo");
const { asArray } = require("../util/array");
const { symbolsToString } = require("../util/symbol");

module.exports = {
  lookup: ({ symbol: symbolOrSymbols }, reply) => {
    const symbols = asArray(symbolOrSymbols);
    YFinance.lookup({ symbols })
      .then((data) => {
        const parsed = Parser.parse({
          symbols,
          data,
        });
        reply(parsed);
      })
      .catch((error) => {
        const string = symbolsToString(symbols);
        console.error(error, `Error looking up symbols: ${string}`);
        reply(`Error looking up symbols: \$${string}`);
      });
  },
};
