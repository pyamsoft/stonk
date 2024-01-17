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
import { LookupResponse } from "../commands/model/LookupResponse";
import { bold } from "../bot/discord/format";
import yf from "yahoo-finance2";

const logger = newLogger("YahooLookup");

export const lookupApi = async function (
  query: string,
): Promise<LookupResponse> {
  return yf.search(query).then((data: unknown) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { quotes } = data as any;

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
      (e1: any, e2: any) => e2.score - e1.score,
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
