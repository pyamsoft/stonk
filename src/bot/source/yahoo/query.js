const { jsonApi } = require("../../../util/api");
const { asArray } = require("../../../util/array");
const Logger = require("../../../logger");
const Lookup = require("./lookup");

function generateQueryUrl(query, fuzzy) {
  return `https://query1.finance.yahoo.com/v1/finance/search?q=${query}&lang=en-US&region=US&quotesCount=6&newsCount=1&enableFuzzyQuery=${!!fuzzy}&quotesQueryId=tss_match_phrase_query&multiQuoteQueryId=multi_quote_single_token_query&newsQueryId=news_cie_vespa&enableCb=true&enableNavLinks=true&enableEnhancedTrivialQuery=true`;
}

module.exports = {
  query: function query(query, fuzzy) {
    const url = generateQueryUrl(query, fuzzy);
    return jsonApi(url).then((data) => {
      const { quotes } = data;
      if (!quotes || quotes.length <= 0) {
        Logger.warn("YFinance query missing quotes");
        return { query };
      }

      const equities = quotes
        .filter((q) => q.quoteType === "EQUITY")
        .filter((q) => !!q.score);

      if (!equities || equities.length <= 0) {
        Logger.warn("YFinance query missing equities");
        return { query };
      }

      const bestGuess = equities.sort((e1, e2) => e2.score - e1.score)[0];
      if (!bestGuess) {
        Logger.warn("YFinance query missing bestGuess");
        return { query };
      }

      const { symbol } = bestGuess;
      if (!symbol) {
        Logger.warn("YFinance query missing symbol");
        return { query };
      }

      const ticker = symbol.toUpperCase();
      return Lookup.lookup(asArray(ticker).map((s) => s.toUpperCase())).then(
        (data) => {
          return {
            query,
            ...data,
          };
        }
      );
    });
  },
};
