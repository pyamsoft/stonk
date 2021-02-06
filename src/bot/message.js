const { code, codeBlock, bold, italic } = require("../util/format");

const NBSP = "\u00a0";

function formatSymbol(symbol) {
  return `${symbol}`;
}

function formatCompany(company) {
  return company;
}

function formatAmountDirection(changeAmount) {
  return changeAmount === 0 ? "" : changeAmount > 0 ? "+" : "-";
}

function formatPrice(price) {
  return `${price.toFixed(2)}`;
}

function formatChangePercent(percent) {
  return `${Math.abs(percent).toFixed(2)}%`;
}

function formatChangeAmount(change) {
  return `${Math.abs(change).toFixed(2)}`;
}

function formatUserId(user) {
  return `<@!${user.id}>`;
}

function formatQuote(quote) {
  const { symbol, company, normal, afterHours } = quote;

  const messageSymbol = bold(formatSymbol(symbol));
  const messageCompany = italic(formatCompany(company));

  const messageNormalPrice = formatPrice(normal.price);
  const messageNormalDirection = formatAmountDirection(normal.amount);
  const messageNormalChangeAmount = formatChangeAmount(normal.amount);
  const messageNormalPercent = formatChangePercent(normal.percent);

  const messageAfterHoursPrice = afterHours
    ? formatPrice(afterHours.price)
    : "";
  const messageAfterHoursDirection = afterHours
    ? formatAmountDirection(afterHours.amount)
    : "";
  const messageAfterHoursChangeAmount = afterHours
    ? formatChangeAmount(afterHours.amount)
    : "";
  const messageAfterHoursPercent = afterHours
    ? formatChangePercent(afterHours.percent)
    : "";
  return `
${messageSymbol}${NBSP}${NBSP}${NBSP}${NBSP}${messageCompany}
${codeBlock(`diff
${messageNormalPrice}
${messageNormalDirection} ${messageNormalChangeAmount} [${messageNormalPercent}]
${
  afterHours
    ? `

(After Hours)
${messageAfterHoursPrice}
${messageAfterHoursDirection} ${messageAfterHoursChangeAmount} [${messageAfterHoursPercent}]
`
    : ""
}
`)}`;
}

module.exports = {
  notify: function notify(author, { symbol, point, price, notifyAbove }) {
    return `${formatUserId(author)} ${formatSymbol(symbol)} has passed the ${
      notifyAbove ? "high" : "low"
    } point of ${formatPrice(point)}, reaching ${formatPrice(price)}`;
  },
  parse: function parse({ query, symbols, data, news }) {
    let message = "";
    if (query) {
      message += `Best guess for: ${code(query)}`;
      message += "\n";
    }

    if (!symbols || symbols.length <= 0) {
      message += `Beep boop try again later.`;
      message += "\n";
    } else {
      for (const symbol of symbols) {
        const quote = data ? data[symbol] : null;
        if (quote) {
          message += formatQuote(quote);
        } else {
          message += `Unable to find data for: ${symbol}`;
        }

        const symbolNews = news ? news[symbol] : null;
        if (symbolNews) {
          message += "\n";
          message += bold("News");
          message += "\n";
          if (symbolNews.error) {
            message += `Unable to find news for: ${symbol}`;
            message += "\n";
          } else {
            for (const newsLink of symbolNews.news) {
              message += newsLink;
              message += "\n";
            }
          }
        }

        message += "\n";
      }
    }

    return message;
  },
};
