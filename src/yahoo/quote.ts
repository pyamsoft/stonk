import { Quote, QuoteResponse } from "../commands/model/QuoteResponse";
import { symbolsToString } from "../commands/symbol";
import { URLSearchParams } from "url";
import { jsonApi } from "../util/api";
import { newLogger } from "../bot/logger";

const logger = newLogger("YahooQuote");

const generateQuoteUrl = function (symbols: string[]): string {
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
};

const stockSymbol = function (quote: any): string {
  return quote.symbol;
};

const normalPrice = function (quote: any): number {
  return quote.regularMarketPrice;
};

const postMarketPrice = function (quote: any): number | undefined {
  return quote.postMarketPrice;
};

const normalPercentChange = function (quote: any): number {
  return quote.regularMarketChangePercent;
};

const postMarketPercentChange = function (quote: any): number | undefined {
  return quote.postMarketChangePercent;
};

const normalAmountChange = function (quote: any): number {
  return quote.regularMarketChange;
};

const postMarketAmountChange = function (quote: any): number | undefined {
  return quote.postMarketChange;
};

const company = function (quote: any): string {
  return quote.shortName;
};

export const parseYFQuote = function (
  symbol: string,
  quote: any
): {
  quote: Quote | undefined;
  error: string | undefined;
} {
  // If there was no result found in the payload
  if (!quote) {
    return {
      quote: undefined,
      error: `Unable to find quote for: ${symbol}`,
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
      error: `Unable to find quote for: ${symbol}`,
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

export const quoteApi = function (symbols: string[]): Promise<QuoteResponse[]> {
  return jsonApi(generateQuoteUrl(symbols)).then((data: any) => {
    if (!data) {
      logger.warn("YF missing response");
      return [];
    }

    const { quoteResponse } = data;
    if (!quoteResponse) {
      logger.warn("YF missing quote response");
      return [];
    }

    const { result } = quoteResponse;
    if (!result) {
      logger.warn("YF missing response result");
      return [];
    }

    const results: QuoteResponse[] = [];
    for (const symbol of symbols) {
      // Find the stock if it exists, if it is not included, then it was wrongly formatted or invalid.
      const stock = result.find((r: any) => r && r.symbol === symbol);
      const { error, quote } = parseYFQuote(symbol, stock);
      results.push({
        symbol,
        error,
        quote,
      });
    }

    return results;
  });
};
