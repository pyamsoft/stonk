import { KeyedObject } from "../../bot/model/KeyedObject";
import { recommendApi } from "../../yahoo/recommend";
import { findQuotesForSymbols } from "./quote";
import { bold } from "../../bot/discord/format";

export const lookupRecommendations = async function (
  symbolList: string[],
): Promise<KeyedObject<string>> {
  if (symbolList.length <= 0) {
    return {};
  }

  return recommendApi(symbolList).then(async (results) => {
    const errors: KeyedObject<string> = {};
    const symbolResolvers = [];
    for (const res of results.data) {
      if (res.recommendations.length > 0) {
        symbolResolvers.push(
          findQuotesForSymbols(res.recommendations).then((results) => {
            // Pair the recs with the symbol
            return {
              symbol: res.symbol,
              recs: results,
            };
          }),
        );
      } else if (res.error) {
        errors[res.symbol] = res.error;
      } else {
        errors[res.symbol] = `Unable to get recommendation: ${res.symbol}`;
      }
    }

    return Promise.all(symbolResolvers).then((results) => {
      const quotes: KeyedObject<string> = {};

      // For lookup
      for (const pairing of results) {
        // The symbol found these recs
        const { symbol, recs } = pairing;
        for (const recSymbol of Object.keys(recs)) {
          // For rec symbol, attach OG, like MSFT found rec AAPL
          const outputText = recs[recSymbol];
          const messageSymbol = `${bold(symbol)} recommends similar ticker =>`;
          quotes[recSymbol] = `${messageSymbol}${outputText}`;
        }
      }

      // Then, for any lookup errors, replace the text with the error text
      for (const key of Object.keys(errors)) {
        quotes[key] = errors[key];
      }

      return quotes;
    });
  });
};
