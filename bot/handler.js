const Commands = require("./commands");
const Logger = require("../logger");
const MessageParser = require("./core/message");
const { codeBlock } = require("../util/format");

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

function reverseLookup(query, { prefix, id, includeNews }, callback) {
  if (!query || query.length <= 0) {
    handleHelp(prefix, id, callback);
  } else {
    handleCommand(
      id,
      Commands.query({ query, fuzzy: true }).then(
        attachNews(includeNews, true)
      ),
      callback
    );
  }
}

function lookupSymbols(symbols, { prefix, id, includeNews }, callback) {
  if (!symbols || symbols.length <= 0) {
    handleHelp(prefix, id, callback);
  } else {
    handleCommand(
      id,
      Commands.lookup({ symbols }).then(attachNews(includeNews, true)),
      callback
    );
  }
}

function isReverseLookupCommand(prefix, content) {
  return content.startsWith(prefix) && content.slice(1).startsWith(prefix);
}

function contentToSymbols(prefix, content) {
  return contentToArray(prefix.length, content);
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
  const args = content.slice(sliceOut).trim().split(/ +/g);
  const symbol = args.shift();
  let symbols = [];
  if (symbol) {
    symbols.push(symbol);
  }
  symbols = [...symbols, ...args];
  return symbols;
}

function parseOptions(what, rawOptions) {
  if (!what || !rawOptions) {
    return {};
  }

  const options = rawOptions.split(",").map((s) => s.toUpperCase());
  Logger.log(`Parse options for symbol '${what}'`, options);
  const news = options.includes("NEWS");
  return { news };
}

module.exports = {
  handle: function handle({ prefix, content, id }, callback) {
    if (isReverseLookupCommand(prefix, content)) {
      const rawQuery = contentToQuery(prefix, content);
      const splitQuery = rawQuery.split(":");
      const [query, rawOptions] = splitQuery;
      const { news } = parseOptions(query, rawOptions);
      reverseLookup(
        query,
        {
          prefix,
          id,
          includeNews: !!news,
        },
        callback
      );
      return;
    }

    const rawSymbols = contentToSymbols(prefix, content);
    const includeNews = {};
    const symbols = [];
    for (const rawSymbol of rawSymbols) {
      const splitSymbol = rawSymbol.split(":").map((s) => s.toUpperCase());
      const [symbol, rawOptions] = splitSymbol;
      const { news } = parseOptions(symbol, rawOptions);
      symbols.push(symbol);
      includeNews[symbol] = !!news;
    }
    lookupSymbols(symbols, { prefix, id, includeNews }, callback);
  },
};
