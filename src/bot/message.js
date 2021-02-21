const { code, codeBlock, bold, italic } = require("../util/format");

const NBSP = "\u00a0";

// Add an extra space for the option md # block header
const STRIKE_LABEL = "STRIKE ";
const BID_LABEL = "BID   ";
const ASK_LABEL = "ASK   ";
const VOLUME_LABEL = "VOLUME";
const IV_LABEL = "IV    ";
const DELTA_LABEL = "DELTA ";
const GAMMA_LABEL = "GAMMA ";

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
  if (!symbolNews) {
    return null;
  }

  let message = "";
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

  return message;
}

function formatOption(option) {
  const { strike, bid, ask, delta, gamma, volume, iv, inTheMoney } = option;
  const msgItm = inTheMoney ? "#" : " ";
  const msgStrike = strike.padEnd(STRIKE_LABEL.length);
  const msgBid = bid.padEnd(BID_LABEL.length);
  const msgAsk = ask.padEnd(ASK_LABEL.length);
  const msgDelta = delta.padEnd(DELTA_LABEL.length);
  const msgGamma = gamma.padEnd(GAMMA_LABEL.length);
  const msgVol = volume.padEnd(VOLUME_LABEL.length);
  const msgIv = iv.padEnd(IV_LABEL.length);
  return `${msgItm}${msgStrike} ${msgBid} ${msgAsk} ${msgDelta} ${msgGamma} ${msgVol} ${msgIv}`;
}

function formatOptionChain(expirationDate, options, isCall) {
  let message = `${expirationDate}`;
  message += "\n";
  message += "\n";
  message += ` ${STRIKE_LABEL} `;
  message += `${BID_LABEL} `;
  message += `${ASK_LABEL} `;
  message += `${DELTA_LABEL} `;
  message += `${GAMMA_LABEL} `;
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

function formatOptions(type, options, respond) {
  const isCall = type === "Calls";

  const dates = Object.keys(options);
  for (let i = 0; i < dates.length; ++i) {
    const expDate = dates[i];
    const message = `
${codeBlock(`md
${type}

${formatOptionChain(expDate, options[expDate], isCall)}
`)}`;
    respond(`option-${expDate}`, message);
  }
}

function parseOptionChain(symbol, symbolOptions, respond) {
  if (!symbolOptions) {
    return;
  }

  const { calls, puts } = symbolOptions;
  if (Object.keys(calls).length > 0 && Object.keys(puts).length > 0) {
    formatOptions("Calls", calls, respond);
    formatOptions("Puts", puts, respond);
  } else {
    let message = "";
    message += `No options for: ${symbol}`;
    message += "\n";
    respond(message);
  }
}

function quotes(msg) {
  const { query, symbols, data } = msg;
  let message = "";

  message += parseQuery(query);

  let error;
  if (!symbols || symbols.length <= 0) {
    message += `Beep boop try again later.`;
    message += "\n";
    error = true;
  } else {
    error = false;
    for (const symbol of symbols) {
      const quote = data ? data[symbol] : null;
      message += parseQuote(symbol, quote);
      message += "\n";
    }
  }

  return {
    error,
    message,
  };
}
function news(msg, respond) {
  const { symbols, news } = msg;
  for (const symbol of symbols) {
    if (news) {
      const symbolNews = news[symbol];
      const message = parseNews(symbol, symbolNews);
      if (message) {
        respond("news", message + "\n");
      }
    }
  }
}
function options(msg, respond) {
  const { symbols, optionChain } = msg;

  for (const symbol of symbols) {
    if (optionChain) {
      const symbolOptionChain = optionChain[symbol];
      parseOptionChain(symbol, symbolOptionChain, respond);
    }
  }
}

module.exports = {
  notify: function notify(author, { symbol, point, price, notifyAbove }) {
    return `${formatUserId(author)} ${formatSymbol(symbol)} has passed the ${
      notifyAbove ? "high" : "low"
    } point of ${formatPrice(point)}, reaching ${formatPrice(price)}`;
  },

  parse: function parse(msg, respond) {
    const { error, message } = quotes(msg);
    respond("quote", message);

    if (error) {
      // Error occured, stop processing
      return;
    }

    news(msg, respond);
    options(msg, respond);
  },
};
