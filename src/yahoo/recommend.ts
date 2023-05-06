/*
 * Copyright 2023 pyamsoft
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bestRecs: any[] = recommendedSymbols.sort(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
