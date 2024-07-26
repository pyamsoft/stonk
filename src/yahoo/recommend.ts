/*
 * Copyright 2024 pyamsoft
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
import { bold } from "../bot/discord/format";
import { Rec, RecommendResponse } from "../commands/model/RecommendResponse";
import yf from "yahoo-finance2";

const logger = newLogger("YahooRecommend");

const parseRecommendation = function (rec: unknown): Rec {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { symbol, recommendedSymbols } = rec as any;
  if (!symbol) {
    logger.warn("YFinance recommend missing finance");
    return {
      symbol: symbol.toUpperCase(),
      recommendations: [],
      error: `Unable to find recommendations for ${bold(symbol)}`,
    };
  }

  if (!recommendedSymbols || recommendedSymbols.length <= 0) {
    logger.warn("YFinance missing recommendedSymbols");
    return {
      symbol: symbol.toUpperCase(),
      recommendations: [],
      error: `Unable to find recommendations for ${bold(symbol)}`,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bestRecs: any[] = recommendedSymbols.sort(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (e1: any, e2: any) => e2.score - e1.score,
  );
  if (bestRecs.length <= 0) {
    logger.warn(
      "YFinance recommend.finance.result.recommendedSymbols missing bestRecs",
    );
    return {
      symbol: symbol.toUpperCase(),
      recommendations: [],
      error: `Unable to find recommendations for ${bold(symbol)}`,
    };
  }

  return {
    symbol: symbol.toUpperCase(),
    recommendations: bestRecs.map((r) => r.symbol).map((s) => s.toUpperCase()),
    error: undefined,
  };
};

export const recommendApi = async function (
  symbols: string[],
): Promise<RecommendResponse> {
  return yf
    .recommendationsBySymbol(symbols)
    .then((data: unknown[]) => data.map((d) => parseRecommendation(d)))
    .then((data) => {
      return { data };
    });
};
