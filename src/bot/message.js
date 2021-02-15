const { code, codeBlock, bold, italic } = require("../util/format");
const Logger = require("../logger");

const logger = Logger.tag("bot/message");

const NBSP = "\u00a0";

// Add an extra space for the option md # block header
const STRIKE_LABEL = "STRIKE ";
const BID_LABEL = "BID   ";
const ASK_LABEL = "ASK   ";
const PERCENT_LABEL = "PERCENT";
const VOLUME_LABEL = "VOLUME";
const IV_LABEL = "IV    ";

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

function parseQuery(query) {
  let message = "";
  if (query) {
    message += `Best guess for: ${code(query)}`;
    message += "\n";
  }

  return message;
}

function parseQuote(symbol, quote) {
  let message;
  if (quote) {
    message = formatQuote(quote);
  } else {
    message = `Unable to find data for: ${symbol}`;
  }

  return message;
}

function parseNews(symbol, symbolNews) {
  let message = "";
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

  return message;
}

function formatOption(option) {
  const { strike, bid, ask, percent, volume, iv, inTheMoney } = option;
  const msgItm = inTheMoney ? "#" : " ";
  const msgStrike = strike.padEnd(STRIKE_LABEL.length);
  const msgBid = bid.padEnd(BID_LABEL.length);
  const msgAsk = ask.padEnd(ASK_LABEL.length);
  const msgPct = percent.padEnd(PERCENT_LABEL.length);
  const msgVol = volume.padEnd(VOLUME_LABEL.length);
  const msgIv = iv.padEnd(IV_LABEL.length);
  return `${msgItm}${msgStrike} ${msgBid} ${msgAsk} ${msgPct} ${msgVol} ${msgIv}`;
}

function formatOptionChain(expirationDate, options, isCall) {
  let message = `${expirationDate}`;
  message += "\n";
  message += "\n";
  message += ` ${STRIKE_LABEL} `;
  message += `${BID_LABEL} `;
  message += `${ASK_LABEL} `;
  message += `${PERCENT_LABEL} `;
  message += `${VOLUME_LABEL} `;
  message += `${IV_LABEL}`;

  const { otm, itm } = options;
  let chain;
  if (isCall) {
    chain = [...itm.reverse(), ...otm];
  } else {
    chain = [...otm.reverse(), ...itm];
  }
  for (const option of chain) {
    message += "\n";
    message += formatOption(option);
  }
  return message;
}

function formatOptions(type, options) {
  const isCall = type === "Calls";

  return `
${codeBlock(`md
${type}

${Object.keys(options)
  .map((expDate) => formatOptionChain(expDate, options[expDate], isCall))
  .join("\n")}
`)}
`;
}

function parseOptionChain(symbol, symbolOptions) {
  let message = "";
  if (symbolOptions) {
    message += "\n";
    message += bold("Options");
    message += "\n";
    const { calls, puts } = symbolOptions;
    message += formatOptions("Calls", calls);
    message += formatOptions("Puts", puts);
  }
  return message;
}

module.exports = {
  notify: function notify(author, { symbol, point, price, notifyAbove }) {
    return `${formatUserId(author)} ${formatSymbol(symbol)} has passed the ${
      notifyAbove ? "high" : "low"
    } point of ${formatPrice(point)}, reaching ${formatPrice(price)}`;
  },
  parse: function parse(msg) {
    logger.log("Parse message: ", msg);
    const { query, symbols, data, news, optionChain } = msg;
    let message = "";

    message += parseQuery(query);

    if (!symbols || symbols.length <= 0) {
      message += `Beep boop try again later.`;
      message += "\n";
    } else {
      for (const symbol of symbols) {
        const quote = data ? data[symbol] : null;
        message += parseQuote(symbol, quote);

        const symbolNews = news ? news[symbol] : null;
        message += parseNews(symbol, symbolNews);

        const symbolOptionChain = optionChain ? optionChain[symbol] : null;
        message += parseOptionChain(symbol, symbolOptionChain);

        message += "\n";
      }
    }

    return message;
  },
};
