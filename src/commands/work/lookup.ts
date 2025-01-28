import { lookupApi } from "../../yahoo/lookup";

export const lookupSymbolForName = function (
  queryList: ReadonlyArray<string>,
  process: (symbols: ReadonlyArray<string>) => Promise<Record<string, string>>,
) {
  const apiList = queryList.map((q) => lookupApi(q));
  return Promise.all(apiList).then((results) => {
    const errors: Record<string, string> = {};
    const symbols: string[] = [];
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
