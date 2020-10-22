const fetch = require("node-fetch");
const Parser = require("./parser");
const { symbolsToString } = require("../../util/symbol");
const Logger = require("../../logger");

function generateUrl(symbols) {
  return `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbolsToString(
    symbols
  )}&format=json&fields=symbol,regularMarketPrice,regularMarketChange,regularMarketChangePercent,regularMarketTime,postMarketPrice,postMarketChange,postMarketChangePercent,postMarketTime,regularMarketVolume,shortName,currency,trailingAnnualDividendRate,trailingAnnualDividendYield`;
}

function lookupSymbols(symbols) {
  const url = generateUrl(symbols);
  return fetch(url).then((res) => {
    if (res.status >= 400) {
      throw new Error(res.statusText);
    } else {
      return res.json();
    }
  });
}

module.exports = {
  lookup: ({ symbols }) => {
    return lookupSymbols(symbols).then((data) => {
      const { quoteResponse } = data;
      if (!quoteResponse) {
        Logger.warn("YFinance missing quoteResponse");
        return {};
      }

      const { result } = quoteResponse;
      if (!result) {
        Logger.warn("YFinance missing quoteResponse.result");
        return {};
      }

      const results = {};
      for (const stock of result) {
        const { symbol } = stock;
        results[symbol] = Parser.parse(stock);
      }

      Logger.log("YFinance results: ", JSON.stringify(results));
      return results;
    });
  },
};
