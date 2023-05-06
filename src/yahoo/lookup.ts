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

import { URLSearchParams } from "url";
import { newLogger } from "../bot/logger";
import { jsonApi } from "../util/api";
import { LookupResponse } from "../commands/model/LookupResponse";
import { bold } from "../bot/discord/format";
import { authYahooFinance } from "./yahoo";

const logger = newLogger("YahooLookup");

const generateLookupUrl = async function (query: string, fuzzy: boolean) {
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

  // YF needs cookie auth
  const crumb = await authYahooFinance();
  if (crumb) {
    params.append("crumb", crumb);
  }

  return `https://query1.finance.yahoo.com/v1/finance/search?${params.toString()}`;
};

export const lookupApi = async function (
  query: string
): Promise<LookupResponse> {
  const url = await generateLookupUrl(query, false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return jsonApi(url).then((data: any) => {
    const { quotes } = data;
    if (!quotes || quotes.length <= 0) {
      logger.warn("YFinance query missing quotes");
      return {
        query,
        symbol: undefined,
        error: `Unable to find stock ticker for ${bold(query)}`,
      };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
