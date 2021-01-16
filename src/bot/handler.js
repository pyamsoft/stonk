const Command = require("./command");
const Option = require("./option");
const MessageParser = require("./message");

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

module.exports = {
  handle: function handle(prefix, { content, id }, respond) {
    if (isReverseLookupCommand(prefix, content)) {
      const rawQuery = contentToQuery(prefix, content);
      const splitQuery = rawQuery.split(":");
      const [query, rawOptions] = splitQuery;
      const { news, watch, stopWatch } = Option.process(query, rawOptions);
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

      const { news, watch, stopWatch } = Option.process(symbol, rawOptions);
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
