export const symbolsToString = function (symbols: string[]): string {
  return symbols
    .map((s) => s.trim())
    .map((s) => s.toUpperCase())
    .join(",");
};
