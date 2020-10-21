const fetch = require("node-fetch");
const parser = require("./parser");

function symbolsToString(symbols) {
  return symbols
    .map((s) => s.trim())
    .map((s) => s.toUpperCase())
    .join(",");
}

function generateUrl(symbols) {
  return `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}&format=json&fields=symbol,regularMarketPrice,regularMarketChange,regularMarketChangePercent,regularMarketTime,postMarketPrice,postMarketChange,postMarketChangePercent,postMarketTime,regularMarketVolume,shortName,currency,trailingAnnualDividendRate,trailingAnnualDividendYield`;
}

function asArray(symbolOrSymbols) {
  let symbols;
  if (Array.isArray(symbolOrSymbols)) {
    symbols = symbolOrSymbols;
  } else {
    symbols = [symbolOrSymbols];
  }
  return symbols;
}

function lookupSymbol(symbol) {
  const url = generateUrl(symbol);
  return fetch(url).then((res) => {
    if (res.status >= 400) {
      throw new Error(res.statusText);
    } else {
      return res.json();
    }
  });
}

module.exports = {
  lookup: (symbolOrSymbols, reply) => {
    const symbols = asArray(symbolOrSymbols);
    const string = symbolsToString(symbols);
    lookupSymbol(string)
      .then((results) => {
        const parsed = parser.parse(symbols, results);
        reply(parsed);
      })
      .catch((error) => {
        console.error(error, "Error looking up symbol: ", string);
        reply(`Error looking up symbols: \$${string}`);
      });
  },
};
