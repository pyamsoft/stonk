const Parser = require("./parser");
const { symbolsToString } = require("../../../util/symbol");
const Logger = require("../../../logger");
const { jsonApi } = require("../../../util/api");

function generateUrl(symbols) {
  return `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbolsToString(
    symbols
  )}&format=json&fields=symbol,regularMarketPrice,regularMarketChange,regularMarketChangePercent,regularMarketTime,postMarketPrice,postMarketChange,postMarketChangePercent,postMarketTime,regularMarketVolume,shortName,currency,trailingAnnualDividendRate,trailingAnnualDividendYield`;
}

module.exports = {
  lookup: function lookup(symbols) {
    return jsonApi(generateUrl(symbols)).then((data) => {
      const { quoteResponse } = data;
      if (!quoteResponse) {
        Logger.warn("YFinance lookup missing quoteResponse");
        return { symbols };
      }

      const { result } = quoteResponse;
      if (!result) {
        Logger.warn("YFinance lookup missing quoteResponse.result");
        return { symbols };
      }

      const results = {};
      for (const stock of result) {
        const { symbol } = stock;
        results[symbol] = Parser.parse(stock);
      }

      return {
        symbols,
        data: results,
      };
    });
  },
};
