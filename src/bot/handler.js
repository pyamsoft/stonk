const Command = require("./command");
const Option = require("./option");
const MessageParser = require("./message");
const { DateTime } = require("luxon");
const Logger = require("../logger");

const logger = Logger.tag("bot/handler");

const NUMBER_REGEX = /\d/;

function isOptionsPositionCommand(prefix, content) {
  return content.startsWith(`${prefix}`.repeat(3));
}

function isReverseLookupCommand(prefix, content) {
  return content.startsWith(`${prefix}`.repeat(2));
}

function contentToSymbols(prefix, content) {
  // We escape here since it may be an escape character like $
  // noinspection RegExpRedundantEscape
  const regex = new RegExp(`\\${prefix}`, "g");

  // A symbol cannot be numbers
  const { isHelp, symbols } = contentToArray(prefix, 0, content);
  const result = symbols
    .filter((s) => s.indexOf(prefix) >= 0 && s.length > 1)
    .filter((s) => {
      // Has options, split up first then check symbol
      if (s.indexOf(":") > 0) {
        const splitUp = s.split(":");
        if (splitUp.length <= 0) {
          return false;
        }

        const symbol = s.split(":")[0];
        return !NUMBER_REGEX.test(symbol);
      } else {
        return !NUMBER_REGEX.test(s);
      }
    })
    .map((s) => s.replace(regex, ""));

  return {
    shouldRespond: isHelp || result.length > 0,
    symbols: result,
  };
}

function tryParseFormat(day, month, year, format) {
  try {
    const date = DateTime.fromFormat(`${day} ${month} ${year}`, format);

    if (!date.isValid) {
      return null;
    }

    return date;
  } catch (e) {
    return null;
  }
}

function tryParseDate(day, month, year) {
  let result = tryParseFormat(
    day,
    month,
    year,
    `${day >= 10 ? "dd" : "d"} LLL yyyy`
  );
  if (result) {
    return result;
  }

  result = tryParseFormat(
    day,
    month,
    year,
    `${day >= 10 ? "dd" : "d"} LLLL yyyy`
  );
  if (result) {
    return result;
  }

  return null;
}

function contentToOptionsPosition(prefix, content) {
  // We escape here since it may be an escape character like $
  // noinspection RegExpRedundantEscape
  const regex = new RegExp(`\\${prefix}`, "g");
  const { isHelp, symbols } = contentToArray(prefix, 3, content);
  const result = symbols.map((s) => s.replace(regex, "")).filter((s) => s);

  let [symbol, leg, side, strike, day, month, year, price] = result;

  if (!symbol) {
    return {
      shouldRespond: true,
      error: "Missing SYMBOL",
    };
  }

  if (!leg) {
    return {
      shouldRespond: true,
      error: "Missing LEG",
    };
  }

  if (!side) {
    return {
      shouldRespond: true,
      error: "Missing SIDE",
    };
  }

  if (!day) {
    return {
      shouldRespond: true,
      error: "Missing DAY",
    };
  }

  if (!month) {
    return {
      shouldRespond: true,
      error: "Missing MONTH",
    };
  }

  if (!year) {
    year = DateTime.local().year;
  } else {
    year =
      year.length === 4
        ? year
        : year.length === 2
        ? `20${year}`
        : year.length === 1
        ? `202${year}`
        : null;
  }

  if (!year) {
    return {
      shouldRespond: true,
      error: "Missing YEAR",
    };
  }

  if (!strike) {
    return {
      shouldRespond: true,
      error: "Missing STRIKE",
    };
  }

  strike = strike.toUpperCase();
  const isValidStrike = strike.endsWith("C") || strike.endsWith("P");
  if (!isValidStrike) {
    return {
      shouldRespond: true,
      error: "Invalid STRIKE. Must be in format #C for CALL or #P for PUT",
    };
  }

  let strikePrice = strike.substring(0, strike.length - 1);
  try {
    strikePrice = parseFloat(strikePrice);
  } catch (e) {
    return {
      shouldRespond: true,
      error: "Invalid STRIKE. Must be in format #C for CALL or #P for PUT",
    };
  }

  if (!price) {
    return {
      shouldRespond: true,
      error: "Missing PRICE",
    };
  }

  if (!price.startsWith("@")) {
    return {
      shouldRespond: true,
      error: "Invalid PRICE. Must be in format @#",
    };
  }

  let cost = price.substring(1);
  try {
    cost = parseFloat(cost);
  } catch (e) {
    return {
      shouldRespond: true,
      error: "Invalid PRICE. Must be in format @#",
    };
  }

  month = month.toLowerCase();
  month = month.charAt(0).toUpperCase() + month.substring(1);

  const isCall = strike.endsWith("C");

  const date = tryParseDate(day, month, year);
  if (!date) {
    return {
      shouldRespond: true,
      error:
        "Invalid DATE. Must be in format {day} {month} {year} (21 June 23  6 May 21)",
    };
  }

  side = side.toUpperCase();
  if (side !== "BUY" && side !== "SELL") {
    return {
      shouldRespond: true,
      error: "Invalid SIDE. Must be BUY or SELL",
    };
  }

  leg = leg.toUpperCase();
  if (leg !== "OPEN" && leg !== "CLOSE") {
    return {
      shouldRespond: true,
      error: "Invalid LEG. Must be OPEN or CLOSE",
    };
  }

  try {
    const position = {
      isCall,
      symbol: symbol.toUpperCase(),
      strike: strikePrice,
      date,
      price: cost,
      leg,
      side,
    };

    return {
      shouldRespond: isHelp || result.length > 0,
      error: null,
      position,
    };
  } catch (e) {
    return {
      shouldRespond: true,
      error: "Invalid DATE. Must be in format {day} {month} {year}",
    };
  }
}

function contentToQuery(prefix, content) {
  const { isHelp, symbols } = contentToArray(
    prefix,
    2 * prefix.length,
    content
  );
  const result = symbols.join(" ").trim();

  return {
    shouldRespond: isHelp || result.length > 0,
    query: result,
  };
}

function contentToArray(prefix, sliceOut, content) {
  // This is just the prefix
  if (content.split("").every((s) => s === prefix)) {
    return {
      isHelp: true,
      symbols: [],
    };
  }

  // Here we separate our "command" name, and our "arguments" for the command.
  // e.g. if we have the message "+say Is this the real life?" , we'll get the following:
  // symbol = say
  // args = ["Is", "this", "the", "real", "life?"]
  const args = content.slice(sliceOut).trim().split(/\s+/g);
  const symbol = args.shift();

  // This is just plain ${prefix}, this is no longer a valid command
  if (symbol === prefix) {
    return {
      isHelp: true,
      symbols: [],
    };
  }

  return {
    isHelp: false,
    symbols: [...(symbol ? [symbol] : []), ...args],
  };
}

module.exports = {
  handle: function handle(prefix, { content, id }, respond) {
    if (isOptionsPositionCommand(prefix, content)) {
      const { shouldRespond, error, position } = contentToOptionsPosition(
        prefix,
        content
      );
      if (!shouldRespond) {
        return;
      }

      if (error) {
        logger.error(error, "Error handling options position.");
        return;
      }

      Command.getOptionPosition(position)
        .then((result) => {
          if (!result) {
            return;
          }

          if (position.leg !== "CLOSE") {
            return;
          }

          if (position.side === "BUY") {
            const change = result.mid - position.price;
            if (change !== 0) {
              logger.log(
                `${change > 0 ? "Gain" : "Loss"}: ${(change * 100).toFixed(2)}`
              );
            }
          } else {
            const change = result.mid - position.price;
            if (change !== 0) {
              logger.log(
                `${change < 0 ? "Gain" : "Loss"}: ${(change * 100).toFixed(2)}`
              );
            }
          }
        })
        .catch((e) => {
          logger.error(e, "Unable to get option for position: ", position);
        });
      return;
    }

    if (isReverseLookupCommand(prefix, content)) {
      const { shouldRespond, query: rawQuery } = contentToQuery(
        prefix,
        content
      );
      if (!shouldRespond) {
        return;
      }
      const splitQuery = rawQuery.split(":");
      const [query, opts] = splitQuery;
      const { watch, stopWatch, optionChain } = Option.process(opts);
      const options = {
        watchSymbols: watch,
        stopWatchSymbols: !!stopWatch,
        optionChain: optionChain,
      };
      Command.reverseLookup(query, prefix, id, respond, options);
      return;
    }

    const { shouldRespond, symbols: rawSymbols } = contentToSymbols(
      prefix,
      content
    );
    if (!shouldRespond) {
      return;
    }

    const symbols = [];

    const options = {
      watchSymbols: {},
      stopWatchSymbols: {},
      optionChain: {},
    };

    for (const rawSymbol of rawSymbols) {
      const splitSymbol = rawSymbol.split(":").map((s) => s.toUpperCase());
      const [symbol, opts] = splitSymbol;
      symbols.push(symbol);

      const { watch, stopWatch, optionChain } = Option.process(opts);
      options.watchSymbols[symbol] = watch;
      options.stopWatchSymbols[symbol] = !!stopWatch;
      options.optionChain[symbol] = optionChain;
    }

    Command.lookup(symbols, prefix, id, respond, options);
  },

  notify: function notify(
    prefix,
    { author, stopWatch, symbol, low, high },
    respond
  ) {
    // Rebuild content
    const content = `${prefix}${symbol.toUpperCase()}`;
    return this.handle(prefix, { content, id: null }, (payload) => {
      const { result } = payload;
      Command.watchSymbols(
        author,
        {
          stopWatch,
          result,
          symbol,
          low,
          high,
        },
        (message) => {
          // Send the notify message to the user directly
          respond({
            result,
            skipCache: true,
            messageId: null,
            messageText: message,
          });

          // And send the new price info
          respond({
            result,
            skipCache: true,
            messageId: null,
            messageText: MessageParser.parse(result),
          });
        }
      );
    });
  },
};
