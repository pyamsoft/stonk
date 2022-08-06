import { newLogger } from "../bot/logger";
import { jsonApi } from "../util/api";
import { bold } from "../bot/discord/format";
import { RecommendResponse } from "../commands/model/RecommendResponse";

const logger = newLogger("YahooRecommend");

const generateRecommendUrl = function (symbol: string) {
  return `https://query2.finance.yahoo.com/v6/finance/recommendationsbysymbol/${symbol}`;
};

export const recommendApi = function (
  symbol: string
): Promise<RecommendResponse> {
  return jsonApi(generateRecommendUrl(symbol)).then((data: any) => {
    const { finance } = data;
    if (!finance) {
      logger.warn("YFinance recommend missing finance");
      return {
        symbol: symbol.toUpperCase(),
        recommendations: [],
        error: `Unable to find recommendations for ${bold(symbol)}`,
      };
    }

    const { result } = finance;
    if (!result || result.length <= 0) {
      logger.warn("YFinance recommend.finance missing result");
      return {
        symbol: symbol.toUpperCase(),
        recommendations: [],
        error: `Unable to find recommendations for ${bold(symbol)}`,
      };
    }

    const theRes = result[0];
    const { recommendedSymbols } = theRes;
    if (!recommendedSymbols || recommendedSymbols.length <= 0) {
      logger.warn(
        "YFinance recommend.finance.result[0] missing recommendedSymbols"
      );
      return {
        symbol: symbol.toUpperCase(),
        recommendations: [],
        error: `Unable to find recommendations for ${bold(symbol)}`,
      };
    }

    const bestRecs: any[] = recommendedSymbols.sort(
      (e1: any, e2: any) => e2.score - e1.score
    );
    if (bestRecs.length <= 0) {
      logger.warn(
        "YFinance recommend.finance.result.recommendedSymbols missing bestRecs"
      );
      return {
        symbol: symbol.toUpperCase(),
        recommendations: [],
        error: `Unable to find recommendations for ${bold(symbol)}`,
      };
    }

    return {
      symbol: symbol.toUpperCase(),
      recommendations: bestRecs
        .map((r) => r.symbol)
        .map((s) => s.toUpperCase()),
      error: undefined,
    };
  });
};
