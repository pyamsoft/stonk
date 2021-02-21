const Command = require("./command");
const Option = require("./option");
const MessageParser = require("./message");

function isReverseLookupCommand(prefix, content) {
  return content.startsWith(`${prefix}${prefix}`);
}

function contentToSymbols(prefix, content) {
  // We escape here since it may be an escape character like $
  // noinspection RegExpRedundantEscape
  const regex = new RegExp(`\\${prefix}`, "g");

  // A symbol cannot be numbers
  const numberRegex = /\d/;
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
        return !numberRegex.test(symbol);
      } else {
        return !numberRegex.test(s);
      }
    })
    .map((s) => s.replace(regex, ""));

  return {
    shouldRespond: isHelp || result.length > 0,
    symbols: result,
  };
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
    if (isReverseLookupCommand(prefix, content)) {
      const { shouldRespond, query: rawQuery } = contentToQuery(
        prefix,
        content
      );
      if (!shouldRespond) {
        return;
      }
      const splitQuery = rawQuery.split(":");
      const [query, rawOptions] = splitQuery;
      const { news, watch, stopWatch, optionChain } = Option.process(
        query,
        rawOptions
      );
      const options = {
        includeNews: !!news,
        watchSymbols: watch,
        stopWatchSymbols: !!stopWatch,
        optionChain: !!optionChain,
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
      includeNews: {},
      watchSymbols: {},
      stopWatchSymbols: {},
      optionChain: {},
    };

    for (const rawSymbol of rawSymbols) {
      const splitSymbol = rawSymbol.split(":").map((s) => s.toUpperCase());
      const [symbol, rawOptions] = splitSymbol;
      symbols.push(symbol);

      const { news, watch, stopWatch, optionChain } = Option.process(
        symbol,
        rawOptions
      );
      options.includeNews[symbol] = !!news;
      options.watchSymbols[symbol] = watch;
      options.stopWatchSymbols[symbol] = !!stopWatch;
      options.optionChain[symbol] = !!optionChain;
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
            cacheKey: null,
            skipCache: true,
            messageId: null,
            messageText: message,
          });

          // And send the new price info
          MessageParser.parse(result, (cacheKey, message) => {
            respond({
              result,
              cacheKey,
              skipCache: true,
              messageId: null,
              messageText: message,
            });
          });
        }
      );
    });
  },
};
