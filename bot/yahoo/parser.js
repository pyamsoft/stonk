const { newQuote } = require("../quote");
const Logger = require("../../logger");

function symbol(quote) {
  return quote.symbol;
}

function price(quote) {
  return quote.regularMarketPrice;
}

function percentChange(quote) {
  return quote.regularMarketChangePercent;
}

function priceChange(quote) {
  return quote.regularMarketChange;
}

module.exports = {
  parse: (quote) => {
    const s = symbol(quote);
    const p = price(quote);
    const pVC = priceChange(quote);
    const pPC = percentChange(quote);
    if (!s || !p || !pVC || !pPC) {
      Logger.warn("Invalid YFinance quote: ", quote);
      return null;
    } else {
      return newQuote(s, p, pVC, pPC);
    }
  },
};
