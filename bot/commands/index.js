const Logger = require("../../logger");
const { asArray } = require("../../util/array");
const { symbolsToString } = require("../../util/symbol");
const Lookup = require("./yahoo/lookup");
const Query = require("./yahoo/query");
const News = require("./google/news");

module.exports = {
  lookup: function lookup({ symbols }) {
    Logger.log(`Perform lookup for symbols: ${symbols}`);
    const symbolList = asArray(symbols);
    return Lookup.lookup({ symbols: symbolList })
      .then((result) => {
        Logger.log("Lookup results: ", JSON.stringify(result));
        return result;
      })
      .catch((error) => {
        const string = symbolsToString(symbolList);
        const msg = `Error looking up symbols: ${string}`;
        Logger.error(error, msg);
        throw new Error(msg);
      });
  },
  query: function query({ query, fuzzy }) {
    Logger.log(`Perform query for string: '${query}'`);
    return Query.query({ query, fuzzy })
      .then((result) => {
        Logger.log("Query results: ", JSON.stringify(result));
        return result;
      })
      .catch((error) => {
        const msg = `Error doing reverse lookup: ${error.message}`;
        Logger.error(error, msg);
        throw new Error(msg);
      });
  },
  news: function news({ symbols, addStockToQuery }) {
    Logger.log(`Perform news for symbols: '${symbols}'`);
    return News.news({ symbols, addStockToQuery })
      .then((result) => {
        Logger.log("News results: ", JSON.stringify(result));
        return result;
      })
      .catch((error) => {
        const msg = `Error doing news lookup: ${error.message}`;
        Logger.error(error, msg);
        throw new Error(msg);
      });
  },
};
