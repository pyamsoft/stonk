const Parser = require("./parser");
const { symbolsToString } = require("../../../util/symbol");
const Logger = require("../../../logger");
const { jsonApi } = require("../../../util/api");

function generateQuoteUrl(symbols) {
  const params = new URLSearchParams();
  params.append("format", "json");
  params.append(
    "fields",
    [
      "symbol",
      "regularMarketPrice",
      "regularMarketChange",
      "regularMarketChangePercent",
      "postMarketPrice",
      "postMarketChange",
      "postMarketChangePercent",
      "shortName",
    ].join(",")
  );
  params.append("symbols", symbolsToString(symbols));
  return `https://query1.finance.yahoo.com/v7/finance/quote?${params.toString()}`;
}

function generateOptionsUrl(symbol) {
  const params = new URLSearchParams();
  params.append("formatted", "true");
  return `https://query1.finance.yahoo.com/v7/finance/options/${symbol}?${params.toString()}`;
}

module.exports = {
  options: function options(symbol) {
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
  lookup: function lookup(symbols) {
    return jsonApi(generateQuoteUrl(symbols)).then((data) => {
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
