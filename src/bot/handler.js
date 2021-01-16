const Command = require("./command");
const Logger = require("../logger");
const MessageParser = require("./message");
const { safeParseNumber } = require("../util/number");

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
      Command.reverseLookup(query, prefix, id, respond, options);
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
