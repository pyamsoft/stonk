const fetch = require("node-fetch");
const Parser = require("./parser");
const { asArray } = require("../../../util/array");
const { symbolsToString } = require("../../../util/symbol");
const Logger = require("../../../logger");

function generateLookupUrl(symbols) {
  return `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbolsToString(
    symbols.map((s) => s.toUpperCase())
  )}&format=json&fields=symbol,regularMarketPrice,regularMarketChange,regularMarketChangePercent,regularMarketTime,postMarketPrice,postMarketChange,postMarketChangePercent,postMarketTime,regularMarketVolume,shortName,currency,trailingAnnualDividendRate,trailingAnnualDividendYield`;
}

function generateQueryUrl(query, fuzzy) {
  return `https://query1.finance.yahoo.com/v1/finance/search?q=${query}&lang=en-US&region=US&quotesCount=6&newsCount=1&enableFuzzyQuery=${!!fuzzy}&quotesQueryId=tss_match_phrase_query&multiQuoteQueryId=multi_quote_single_token_query&newsQueryId=news_cie_vespa&enableCb=true&enableNavLinks=true&enableEnhancedTrivialQuery=true`;
}

function handleFetch(url) {
  return fetch(url).then((res) => {
    if (res.status >= 400) {
      throw new Error(res.statusText);
    } else {
      return res.json();
    }
  });
}

function lookupSymbols(symbols) {
  Logger.print(`Perform lookup for symbol: '${symbols}'`);
  const url = generateLookupUrl(symbols);
  return handleFetch(url);
}

function queryYahoo(query, fuzzy) {
  Logger.print(`Perform query for string: '${query}'`);
  const url = generateQueryUrl(query, fuzzy);
  return handleFetch(url);
}

module.exports = {
  lookup: function lookup({ symbols }) {
    return lookupSymbols(symbols).then((data) => {
      const { quoteResponse } = data;
      if (!quoteResponse) {
        Logger.warn("YFinance lookup missing quoteResponse");
        return {};
      }

      const { result } = quoteResponse;
      if (!result) {
        Logger.warn("YFinance lookup missing quoteResponse.result");
        return {};
      }

      const results = {};
      for (const stock of result) {
        const { symbol } = stock;
        results[symbol] = Parser.parse(stock);
      }

      return results;
    });
  },

  query: function query({ query, fuzzy }) {
    return queryYahoo(query, fuzzy).then((data) => {
      const { quotes } = data;
      if (!quotes || quotes.length <= 0) {
        Logger.warn("YFinance query missing quotes");
        return {};
      }

      const equities = quotes
        .filter((q) => q.quoteType === "EQUITY")
        .filter((q) => !!q.score);

      if (!equities || equities.length <= 0) {
        Logger.warn("YFinance query missing equities");
        return {};
      }

      const bestGuess = equities.sort((e1, e2) => e2.score - e1.score)[0];
      if (!bestGuess) {
        Logger.warn("YFinance query missing bestGuess");
        return {};
      }

      const { symbol } = bestGuess;
      if (!symbol) {
        Logger.warn("YFinance query missing symbol");
        return {};
      }

      const ticker = symbol.toUpperCase();
      return this.lookup({ symbols: asArray(ticker) }).then((data) => {
        return {
          symbols: [ticker],
          query,
          data,
        };
      });
    });
  },
};
