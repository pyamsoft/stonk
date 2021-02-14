const Parser = require("./parser");
const { symbolsToString } = require("../../../util/symbol");
const Logger = require("../../../logger");
const { jsonApi } = require("../../../util/api");

function generateUrl(symbols) {
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
