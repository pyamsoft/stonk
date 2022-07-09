import { URLSearchParams } from "url";
import { newLogger } from "../bot/logger";
import { jsonApi } from "../util/api";
import { LookupResponse } from "../commands/model/LookupResponse";
import { bold } from "../bot/discord/format";

const logger = newLogger("YahooLookup");

const generateLookupUrl = function (query: string, fuzzy: boolean) {
  const params = new URLSearchParams();
  params.append("q", query);
  params.append("lang", "en-US");
  params.append("region", "US");
  params.append("quotesCount", "6");
  params.append("newsCount", "1");
  params.append("enableFuzzyQuery", `${fuzzy}`);
  params.append("quotesQueryId", "tss_match_phrase_query");
  params.append("multiQuoteQueryId", "multi_quote_single_token_query");
  params.append("newsQueryId", "news_cie_vespa");
  params.append("enableCb", "true");
  params.append("enableNavLinks", "true");
  params.append("enableEnhancedTrivialQuery", "true");
  return `https://query1.finance.yahoo.com/v1/finance/search?${params.toString()}`;
};

export const lookupApi = function (query: string): Promise<LookupResponse> {
  return jsonApi(generateLookupUrl(query, false)).then((data: any) => {
    const { quotes } = data;
    if (!quotes || quotes.length <= 0) {
      logger.warn("YFinance query missing quotes");
      return {
        query,
        symbol: undefined,
        error: `Unable to find stock ticker for ${bold(query)}`,
      };
    }

    const equities = quotes.filter((q: any) => !!q.score);
    if (!equities || equities.length <= 0) {
      logger.warn("YFinance query missing equities");
      return {
        query,
        symbol: undefined,
        error: `Unable to find stock ticker for ${bold(query)}`,
      };
    }

    const bestGuesses = equities.sort(
      (e1: any, e2: any) => e2.score - e1.score
    );
    if (bestGuesses.length <= 0) {
      logger.warn("YFinance query missing bestGuess");
      return {
        query,
        symbol: undefined,
        error: `Unable to find stock ticker for ${bold(query)}`,
      };
    }

    const { symbol } = bestGuesses[0];
    if (!symbol) {
      logger.warn("YFinance query missing symbol");
      return {
        query,
        symbol: undefined,
        error: `Unable to find stock ticker for ${bold(query)}`,
      };
    }

    return { query, symbol: symbol.toUpperCase(), error: undefined };
  });
};