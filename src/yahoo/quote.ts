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

import { Quote, QuoteResponse } from "../commands/model/QuoteResponse";
import { newLogger } from "../bot/logger";
import { bold } from "../bot/discord/format";
import yf from "yahoo-finance2";

const logger = newLogger("YahooQuote");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const stockSymbol = function (quote: any): string {
  return quote.symbol;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const normalPrice = function (quote: any): number {
  return quote.regularMarketPrice;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const postMarketPrice = function (quote: any): number | undefined {
  return quote.postMarketPrice;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const normalPercentChange = function (quote: any): number {
  return quote.regularMarketChangePercent;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const postMarketPercentChange = function (quote: any): number | undefined {
  return quote.postMarketChangePercent;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const normalAmountChange = function (quote: any): number {
  return quote.regularMarketChange;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const postMarketAmountChange = function (quote: any): number | undefined {
  return quote.postMarketChange;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const company = function (quote: any): string {
  return quote.shortName || quote.longName;
};

const parseYFQuote = function (
  symbol: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  quote: any
): {
  quote: Quote | undefined;
  error: string | undefined;
} {
  // If there was no result found in the payload
  if (!quote) {
    return {
      quote: undefined,
      error: `Unable to find quote for: ${bold(symbol)}`,
    };
  }

  const companySymbol = stockSymbol(quote);
  const companyPrice = normalPrice(quote);
  const companyAmountChange = normalAmountChange(quote);
  const companyPercentChange = normalPercentChange(quote);
  const companyName = company(quote);

  // IF the payload is missing something
  // '==' null checks for '=== null' and '=== undefined'
  if (
    companySymbol == null ||
    companyName == null ||
    companyPrice == null ||
    companyAmountChange == null ||
    companyPercentChange == null
  ) {
    return {
      quote: undefined,
      error: `Unable to find quote for: ${bold(symbol)}`,
    };
  }

  const data: Quote = {
    symbol: companySymbol,
    companyName,
    normalMarket: {
      price: companyPrice,
      changeAmount: companyAmountChange,
      changePercent: companyPercentChange,
    },
  };
  const afterHoursPrice = postMarketPrice(quote);
  const afterHoursChangeAmount = postMarketAmountChange(quote);
  const afterHoursChangePercent = postMarketPercentChange(quote);

  // '==' null checks for '=== null' and '=== undefined'
  if (
    afterHoursPrice != null &&
    afterHoursChangeAmount != null &&
    afterHoursChangePercent != null
  ) {
    data.afterMarket = {
      price: afterHoursPrice,
      changeAmount: afterHoursChangeAmount,
      changePercent: afterHoursChangePercent,
    };
  }

  return {
    quote: data,
    error: undefined,
  };
};

export const quoteApi = async function (
  symbols: string[]
): Promise<QuoteResponse[]> {
  return yf.quote(symbols).then((data: unknown[]) => {
    if (!data) {
      logger.warn("YF missing response");
      const results: QuoteResponse[] = [];
      for (let s of symbols) {
        s = s.toUpperCase();
        results.push({
          symbol: s,
          error: `Unable to find quote for ${bold(s)}`,
          quote: undefined,
        });
      }
      return results;
    }

    const results: QuoteResponse[] = [];
    for (const symbol of symbols) {
      // Find the stock if it exists, if it is not included, then it was wrongly formatted or invalid.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const stock = data.find((r: any) => r && r.symbol === symbol);
      const { error, quote } = parseYFQuote(symbol, stock);
      results.push({
        symbol: symbol.toUpperCase(),
        error,
        quote,
      });
    }

    return results;
  });
};
