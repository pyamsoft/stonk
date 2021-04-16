const { codeBlock, bold, italic } = require("../util/format");

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

function parseQuote(symbol, quote) {
  let message;
  if (quote) {
    message = formatQuote(quote);
  } else {
    message = `Unable to find data for: ${symbol}`;
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

function formatOptions(type, options) {
  const isCall = type === "Calls";

  let message = "";
  const dates = Object.keys(options);
  for (let i = 0; i < dates.length; ++i) {
    const expDate = dates[i];
    message += `
${codeBlock(`md
${type}

${formatOptionChain(expDate, options[expDate], isCall)}
`)}`;
  }
  return message;
}

function parseOptionChain(symbol, symbolOptions) {
  if (!symbolOptions) {
    return null;
  }

  const { calls, puts } = symbolOptions;
  let message = "";
  if (Object.keys(calls).length > 0 && Object.keys(puts).length > 0) {
    message += formatOptions("Calls", calls);
    message += formatOptions("Puts", puts);
  } else {
    message += `No options for: ${symbol}`;
    message += "\n";
  }

  return message;
}

module.exports = {
  notify: function notify(
    author,
    { symbol, point, price, notifyAbove, isAfterHours }
  ) {
    return `${formatUserId(author)} ${formatSymbol(symbol)} has passed the ${
      notifyAbove ? "high" : "low"
    } point ${isAfterHours ? "(after hours) " : ""}of ${formatPrice(
      point
    )}, reaching ${formatPrice(price)}`;
  },

  parse: function parse(msg) {
    const { symbols, data } = msg;
    const { optionChain } = msg;

    let error = null;
    const result = {};

    if (!symbols || symbols.length <= 0) {
      error = `Beep boop try again later.`;
      error += "\n";
    } else {
      for (const symbol of symbols) {
        let message = "";
        const quote = data ? data[symbol] : null;
        message += parseQuote(symbol, quote);
        message += "\n";

        if (optionChain) {
          const symbolOptionChain = optionChain[symbol];
          const msg = parseOptionChain(symbol, symbolOptionChain);
          if (msg) {
            message += msg;
          }
        }

        result[symbol] = message;
      }
    }

    return {
      error,
      data: result,
    };
  },
};
