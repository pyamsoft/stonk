import { lookupApi } from "../../yahoo/lookup";
import { KeyedObject } from "../../bot/model/KeyedObject";

export const lookupSymbolForName = function (
  queryList: string[],
  process: (symbols: string[]) => Promise<KeyedObject<string>>,
) {
  const apiList = queryList.map((q) => lookupApi(q));
  return Promise.all(apiList).then((results) => {
    const errors: KeyedObject<string> = {};
    const symbols = [];
    for (const res of results) {
      if (!!res.symbol && !!res.symbol.trim()) {
        symbols.push(res.symbol.toUpperCase());
      } else if (res.error) {
        errors[res.query] = res.error;
      } else {
        errors[res.query] = `Unable to lookup ticker: ${res.query}`;
      }
    }

    return process(symbols).then((quotes) => {
      for (const key of Object.keys(errors)) {
        quotes[key] = errors[key];
      }

      return quotes;
    });
  });
};
