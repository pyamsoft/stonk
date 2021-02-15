const { jsonApi } = require("../../../util/api");
const { asArray } = require("../../../util/array");
const Logger = require("../../../logger");
const Lookup = require("./lookup");

const logger = Logger.tag("bot/source/yahoo/query");

function generateQueryUrl(query, fuzzy) {
  const params = new URLSearchParams();
  params.append("q", query);
  params.append("lang", "en-US");
  params.append("region", "US");
  params.append("quotesCount", 6);
  params.append("newsCount", 1);
  params.append("enableFuzzyQuery", !!fuzzy);
  params.append("quotesQueryId", "tss_match_phrase_query");
  params.append("multiQuoteQueryId", "multi_quote_single_token_query");
  params.append("newsQueryId", "news_cie_vespa");
  params.append("enableCb", true);
  params.append("enableNavLinks", true);
  params.append("enableEnhancedTrivialQuery", true);
  return `https://query1.finance.yahoo.com/v1/finance/search?${params.toString()}`;
}

module.exports = {
  query: function query(query, fuzzy) {
    logger.log("Reverse lookup query for: ", query);
    const url = generateQueryUrl(query, fuzzy);
    return jsonApi(url).then((data) => {
      const { quotes } = data;
      if (!quotes || quotes.length <= 0) {
        logger.warn("YFinance query missing quotes");
        return { query };
      }

      const equities = quotes
        .filter((q) => q.quoteType === "EQUITY")
        .filter((q) => !!q.score);

      if (!equities || equities.length <= 0) {
        logger.warn("YFinance query missing equities");
        return { query };
      }

      const bestGuess = equities.sort((e1, e2) => e2.score - e1.score)[0];
      if (!bestGuess) {
        logger.warn("YFinance query missing bestGuess");
        return { query };
      }

      const { symbol } = bestGuess;
      if (!symbol) {
        logger.warn("YFinance query missing symbol");
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
