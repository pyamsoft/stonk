const { newQuote } = require("../quote");

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
    return newQuote(
      symbol(quote),
      price(quote),
      priceChange(quote),
      percentChange(quote)
    );
  },
};
