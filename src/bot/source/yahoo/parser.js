const Market = require("../../market");
const { newQuote } = require("../../model/quote");

function symbol(quote) {
  return quote.symbol;
}

function normalPrice(quote) {
  return quote.regularMarketPrice;
}

function postMarketPrice(quote) {
  return quote.postMarketPrice;
}

function normalPercentChange(quote) {
  return quote.regularMarketChangePercent;
}

function postMarketPercentChange(quote) {
  return quote.postMarketChangePercent;
}

function normalAmountChange(quote) {
  return quote.regularMarketChange;
}

function postMarketAmountChange(quote) {
  return quote.postMarketChange;
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
    const companySymbol = symbol(quote);
    const companyPrice = normalPrice(quote);
    const companyAmountChange = normalAmountChange(quote);
    const companyPercentChange = normalPercentChange(quote);
    const companyName = company(quote);
    if (
      isAnyInvalid(
        companySymbol,
        companyPrice,
        companyAmountChange,
        companyPercentChange,
        companyName
      )
    ) {
      return null;
    }

    const data = {
      company: companyName,
      symbol: companySymbol,
      normal: {
        price: companyPrice,
        amount: companyAmountChange,
        percent: companyPercentChange,
      },
    };
    if (!Market.isRegularMarket()) {
      const afterHoursPrice = postMarketPrice(quote);
      const afterHoursChangeAmount = postMarketAmountChange(quote);
      const afterHoursChangePercent = postMarketPercentChange(quote);
      if (
        !isAnyInvalid(
          companySymbol,
          afterHoursPrice,
          afterHoursChangeAmount,
          afterHoursChangePercent,
          companyName
        )
      ) {
        data.afterHours = {
          price: afterHoursPrice,
          amount: afterHoursChangeAmount,
          percent: afterHoursChangePercent,
        };
      }
    }
    return newQuote(data);
  },
};
