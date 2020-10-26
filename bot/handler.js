const Commands = require("./commands");
const Logger = require("../logger");
const MessageParser = require("./core/message");
const { codeBlock } = require("../util/format");

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
  
  ${prefix}             This help.
  ${prefix}${prefix}            This help.

  ${prefix} SYMBOL...   Price information for <SYMBOL>
  ${prefix}${prefix} QUERY      Query results for <QUERY>
  `);
  callback({
    skipCache: false,
    messageId: id,
    messageText: message,
  });
}

function attachNews(include, addStockToQuery) {
  return function newAppender(result) {
    if (include && result.symbols) {
      return Commands.news({
        symbols: result.symbols,
        addStockToQuery,
      }).then((news) => {
        return {
          ...result,
          news,
        };
      });
    } else {
      return result;
    }
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

module.exports = {
  handle: function handle({ prefix, content, id }, callback) {
    // Make this an option input
    const includeNews = true;

    if (isReverseLookupCommand(prefix, content)) {
      const query = contentToQuery(prefix, content);
      reverseLookup(
        query,
        {
          prefix,
          id,
          includeNews,
        },
        callback
      );
      return;
    }

    const symbols = contentToSymbols(prefix, content);
    lookupSymbols(symbols, { prefix, id, includeNews }, callback);
  },
};
