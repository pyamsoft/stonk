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
    return {
      symbol: symbol(quote),
      price: price(quote),
      changeAmount: priceChange(quote),
      changePercent: percentChange(quote),
    };
  },
};
