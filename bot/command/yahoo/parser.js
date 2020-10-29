const { newQuote } = require("../../model/quote");
const Logger = require("../../../logger");

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

function company(quote) {
  return quote.shortName;
}

function isInvalid(value) {
  return value === null || value === undefined;
}

function isAnyInvalid(...values) {
  return values.some((v) => isInvalid(v));
}

module.exports = {
  parse: function parse(quote) {
    const s = symbol(quote);
    const p = price(quote);
    const pVC = priceChange(quote);
    const pPC = percentChange(quote);
    const sn = company(quote);
    if (isAnyInvalid(s, p, pVC, pPC, sn)) {
      return null;
    } else {
      return newQuote({
        company: sn,
        symbol: s,
        price: p,
        changeAmount: pVC,
        changePercent: pPC,
      });
    }
  },
};
