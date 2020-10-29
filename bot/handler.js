const Commands = require("./commands");
const Logger = require("../logger");
const MessageParser = require("./core/message");
const { codeBlock } = require("../util/format");
const { safeParseNumber } = require("../util/number");

const TYPE_OBJECT = typeof {};

function handleCommand(id, command, callback) {
  command
    .then((result) => {
      Logger.log("Command result: ", result);
      const parsed = MessageParser.parse(result);
      callback({
        skipCache: false,
        messageId: id,
        messageText: parsed,
      });
    })
    .catch((error) => {
      callback({
        skipCache: true,
        messageId: id,
        messageText: error.message,
      });
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
  watch[LOW:HIGH]           Watch the symbol for if/when it crosses the <LOW> or <HIGH> points
  
  An OPTION can be added to a COMMAND by appending it with ':'
  
  [EXAMPLE]
  ${prefix}MSFT                     Gets price information for MSFT
  ${prefix}${prefix}Microsoft Corporation   Reverse lookup a symbol for 'Microsoft Corporation' and gets price information.
  ${prefix}AAPL:news                Gets price information and news for AAPL
  ${prefix}${prefix}Tesla:news              Reverse lookup a symbol for 'Tesla' and gets price information.
  `);
  callback({
    skipCache: false,
    messageId: id,
    messageText: message,
  });
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
          return {
            ...result,
            news,
          };
        });
    }

    return result;
  };
}

function listenSymbols(watch, postNewMessage) {
  return function newWatcher(result) {
    if (result.symbols) {
      Logger.log("Start watching symbols: ", watch);
    }
    return result;
  };
}

function reverseLookup(
  query,
  prefix,
  id,
  respond,
  postNewMesage,
  { includeNews, watchSymbols }
) {
  if (!query || query.length <= 0) {
    handleHelp(prefix, id, respond);
  } else {
    handleCommand(
      id,
      Commands.query({ query, fuzzy: true })
        .then(attachNews(includeNews, true))
        .then((result) => {
          if (result.symbols) {
            if (watchSymbols) {
              const correctlyFormattedWatchSymbols = {};
              correctlyFormattedWatchSymbols[result.symbols[0]] = watchSymbols;
              const resultParser = listenSymbols(
                correctlyFormattedWatchSymbols,
                postNewMesage
              );
              return resultParser(result);
            }
          }

          return result;
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
  postNewMessage,
  { includeNews, watchSymbols }
) {
  if (!symbols || symbols.length <= 0) {
    handleHelp(prefix, id, respond);
  } else {
    handleCommand(
      id,
      Commands.lookup({ symbols })
        .then(attachNews(includeNews, true))
        .then(listenSymbols(watchSymbols, postNewMessage)),
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

function parseWatchOption(options) {
  const possibleWatch = options.find((o) => o.indexOf("WATCH") >= 0);
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
  return { news, watch };
}

module.exports = {
  handle: function handle({ prefix, content, id, respond, postNewMessage }) {
    if (isReverseLookupCommand(prefix, content)) {
      const rawQuery = contentToQuery(prefix, content);
      Logger.log("Raw query is: ", rawQuery);
      const splitQuery = rawQuery.split(":");
      const [query, rawOptions] = splitQuery;
      const { news, watch } = parseOptions(query, rawOptions);
      const options = {
        includeNews: news,
        watchSymbols: watch,
      };
      Logger.log(`Perform reverse lookup: '${query}'`, options);
      reverseLookup(query, prefix, id, respond, postNewMessage, options);
      return;
    }

    const rawSymbols = contentToSymbols(prefix, content);
    const symbols = [];

    const includeNews = {};
    const watchSymbols = {};

    Logger.log("Raw symbols are: ", rawSymbols);
    for (const rawSymbol of rawSymbols) {
      const splitSymbol = rawSymbol.split(":").map((s) => s.toUpperCase());
      const [symbol, rawOptions] = splitSymbol;
      symbols.push(symbol);

      const { news, watch } = parseOptions(symbol, rawOptions);
      includeNews[symbol] = !!news;
      watchSymbols[symbol] = watch;
    }

    const options = {
      includeNews,
      watchSymbols,
    };

    Logger.log(`Perform symbol lookup: '${symbols}'`, options);
    lookupSymbols(symbols, prefix, id, respond, postNewMessage, options);
  },
};
