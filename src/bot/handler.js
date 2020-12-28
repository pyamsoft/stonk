const Commands = require("./command");
const Logger = require("../logger");
const MessageParser = require("./message");
const WatchList = require("./watch");
const { codeBlock } = require("../util/format");
const { safeParseNumber } = require("../util/number");

const TYPE_OBJECT = typeof {};
const EMPTY_OBJECT = {};

function handleCommand(id, command, callback) {
  command
    .then(({ result, extras }) => {
      const parsed = MessageParser.parse(result);
      callback(
        {
          result,
          skipCache: false,
          messageId: id,
          messageText: parsed,
        },
        extras
      );
    })
    .catch((error) => {
      callback(
        {
          error,
          skipCache: true,
          messageId: id,
          messageText: error.message,
        },
        EMPTY_OBJECT
      );
    });
}

function handleHelp(prefix, id, callback) {
  // Looks weird but this lines up.
  const message = codeBlock(`Beep Boop.

  [COMMANDS]
  ${prefix}                         This help.
  ${prefix}${prefix}                        This help.
  ${prefix} SYMBOL... [OPTION...]   Price information for <SYMBOL>
  ${prefix}${prefix} QUERY [OPTION...]      Query results for <QUERY>
  
  [OPTIONS]
  news                      Get recent news for a <SYMBOL> or <QUERY>
  watch[LOW|HIGH]           Watch the <SYMBOL> for if/when it crosses the <LOW> or <HIGH> points
  stopwatch                 Stop watching the <SYMBOL>
  
  An OPTION can be added to a COMMAND by appending it with ':'
  
  [EXAMPLE]
  ${prefix}MSFT                     Gets price information for MSFT
  ${prefix}${prefix}Microsoft Corporation   Reverse lookup a symbol for 'Microsoft Corporation' and gets price information.
  ${prefix}AAPL:news                Gets price information and news for AAPL
  ${prefix}${prefix}Tesla:news              Reverse lookup a symbol for 'Tesla' and gets price information.
  `);
  callback(
    {
      skipCache: false,
      messageId: id,
      messageText: message,
    },
    EMPTY_OBJECT
  );
}

function attachNews(include, addStockToQuery) {
  return function newAppender(result) {
    if (result.symbols) {
      let includeSymbols = [];

      // Include news if true or symbol contained in news object payload
      if (include === true) {
        includeSymbols = result.symbols;
      } else if (typeof include === TYPE_OBJECT) {
        for (const symbol of Object.keys(include)) {
          if (include[symbol]) {
            includeSymbols.push(symbol);
          }
        }
      }

      if (includeSymbols.length > 0)
        return Commands.news({
          symbols: includeSymbols,
          addStockToQuery,
        }).then((news) => {
          return { ...result, news };
        });
    }

    return result;
  };
}

function reverseLookup(
  query,
  prefix,
  id,
  respond,
  { includeNews, watchSymbols, stopWatchSymbols }
) {
  if (!query || query.length <= 0) {
    handleHelp(prefix, id, respond);
  } else {
    handleCommand(
      id,
      Commands.query({ query, fuzzy: true })
        .then(attachNews(includeNews, true))
        .then((result) => {
          // Turn the watchSymbols payload into the expected format
          if (result.symbols) {
            const [symbol] = result.symbols;
            if (symbol) {
              const correctWatchSymbols = {};
              correctWatchSymbols[symbol] = watchSymbols;
              const correctStopWatchSymbols = {};
              correctStopWatchSymbols[symbol] = stopWatchSymbols;
              return {
                result,
                extras: {
                  watchSymbols: correctWatchSymbols,
                  stopWatchSymbols: correctStopWatchSymbols,
                },
              };
            }
          }

          return {
            result,
            extras: EMPTY_OBJECT,
          };
        }),
      respond
    );
  }
}

function lookupSymbols(
  symbols,
  prefix,
  id,
  respond,
  { includeNews, watchSymbols, stopWatchSymbols }
) {
  if (!symbols || symbols.length <= 0) {
    handleHelp(prefix, id, respond);
  } else {
    handleCommand(
      id,
      Commands.lookup({ symbols })
        .then(attachNews(includeNews, true))
        .then((result) => {
          return {
            result,
            extras: { watchSymbols, stopWatchSymbols },
          };
        }),
      respond
    );
  }
}

function isReverseLookupCommand(prefix, content) {
  return content.startsWith(prefix) && content.slice(1).startsWith(prefix);
}

function contentToSymbols(prefix, content) {
  // We escape here since it may be an escape character like $
  // noinspection RegExpRedundantEscape
  const regex = new RegExp(`\\${prefix}`, "g");

  return contentToArray(prefix.length, content).map((s) =>
    s.replace(regex, "")
  );
}

function contentToQuery(prefix, content) {
  return contentToArray(2 * prefix.length, content)
    .join(" ")
    .trim();
}

function contentToArray(sliceOut, content) {
  // Here we separate our "command" name, and our "arguments" for the command.
  // e.g. if we have the message "+say Is this the real life?" , we'll get the following:
  // symbol = say
  // args = ["Is", "this", "the", "real", "life?"]
  const args = content.slice(sliceOut).trim().split(/\s+/g);
  const symbol = args.shift();
  let symbols = [];
  if (symbol) {
    symbols.push(symbol);
  }
  symbols = [...symbols, ...args];
  return symbols;
}

function parseNewsOption(options) {
  return options.includes("NEWS");
}

function parseStopWatchOption(options) {
  return options.includes("STOPWATCH");
}

function parseWatchOption(options) {
  const possibleWatch = options.find((o) => o.indexOf("WATCH[") >= 0);
  // WATCH[LOW|HIGH]
  if (possibleWatch) {
    const valuesSection = possibleWatch.replace(/WATCH/g, "");
    if (!valuesSection) {
      Logger.warn("WATCH missing values section", possibleWatch);
      return null;
    }
    // [LOW|HIGH]
    const values = valuesSection
      .replace(/\[/g, " ")
      .replace(/\]/g, " ")
      .replace(/\|/g, " ")
      .trim()
      .split(/\s+/g);

    if (!values || values.length <= 0) {
      Logger.warn("WATCH missing values", possibleWatch, valuesSection);
      return null;
    }

    // [ LOW, HIGH ]
    const [low, high] = values;
    if (!low || !high) {
      Logger.warn("WATCH missing low high", possibleWatch, values);
      return null;
    }

    const lowNumber = safeParseNumber(low);
    const highNumber = safeParseNumber(high);
    if (lowNumber < 0 || highNumber < 0) {
      Logger.warn("WATCH invalid low high", possibleWatch, low, high);
      return null;
    }

    return {
      low: lowNumber,
      high: highNumber,
    };
  }

  return null;
}

function parseOptions(what, rawOptions) {
  if (!what || !rawOptions) {
    return {};
  }

  const options = rawOptions.split(",").map((s) => s.toUpperCase());
  Logger.log(`Parse options for symbol '${what}'`, options);
  const news = parseNewsOption(options);
  const watch = parseWatchOption(options);
  const stopWatch = parseStopWatchOption(options);
  return { news, watch, stopWatch };
}

function isValidPrice(price) {
  return price && price >= 0;
}

function isPassedPoint(point, price, notifyAbove) {
  if (!isValidPrice(point) || !isValidPrice(price)) {
    return false;
  }

  // If the original price is lower/higher than the watch point, this will fire.
  // That's what you want right?
  return notifyAbove ? price > point : price < point;
}

function parseWatchLookupResult(
  author,
  { stopWatch, result, symbol, low, high },
  respond
) {
  if (!result || !result.data) {
    Logger.warn("Watch command lookup returned error");
    return;
  }

  // Parse results
  const resultData = result.data[symbol];
  const newPrice = resultData.price;

  // Fire if low is passed
  if (isPassedPoint(low, newPrice, false)) {
    Logger.log("Low point passed: ", symbol, low, newPrice);
    WatchList.markLowPassed(stopWatch, { symbol });
    respond(
      MessageParser.notify(author, {
        symbol,
        point: low,
        price: newPrice,
        notifyAbove: false,
      })
    );
  }

  // Fire if high is passed
  if (isPassedPoint(high, newPrice, true)) {
    Logger.log("High point passed: ", symbol, high, newPrice);
    WatchList.markHighPassed(stopWatch, { symbol });
    respond(
      MessageParser.notify(author, {
        symbol,
        point: high,
        price: newPrice,
        notifyAbove: true,
      })
    );
  }
}

module.exports = {
  handle: function handle(prefix, { content, id }, respond) {
    if (isReverseLookupCommand(prefix, content)) {
      const rawQuery = contentToQuery(prefix, content);
      const splitQuery = rawQuery.split(":");
      const [query, rawOptions] = splitQuery;
      const { news, watch, stopWatch } = parseOptions(query, rawOptions);
      const options = {
        includeNews: !!news,
        watchSymbols: watch,
        stopWatchSymbols: !!stopWatch,
      };
      reverseLookup(query, prefix, id, respond, options);
      return;
    }

    const rawSymbols = contentToSymbols(prefix, content);
    const symbols = [];

    const options = {
      includeNews: {},
      watchSymbols: {},
      stopWatchSymbols: {},
    };

    for (const rawSymbol of rawSymbols) {
      const splitSymbol = rawSymbol.split(":").map((s) => s.toUpperCase());
      const [symbol, rawOptions] = splitSymbol;
      symbols.push(symbol);

      const { news, watch, stopWatch } = parseOptions(symbol, rawOptions);
      options.includeNews[symbol] = !!news;
      options.watchSymbols[symbol] = watch;
      options.stopWatchSymbols[symbol] = !!stopWatch;
    }

    lookupSymbols(symbols, prefix, id, respond, options);
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
      parseWatchLookupResult(
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
          const parsed = MessageParser.parse(result);
          respond({
            result,
            skipCache: true,
            messageId: null,
            messageText: parsed,
          });
        }
      );
    });
  },
};
