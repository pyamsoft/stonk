const Discord = require("discord.js");
const Commands = require("./commands");
const Logger = require("../logger");
const Status = require("./core/status");
const Cache = require("./core/cache");
const MessageParser = require("./core/message");
const { codeBlock } = require("../util/format");

// 2 hours
const STALE_OFFSET_MS = 2 * 60 * 60 * 1000;

function botWatchReady(client) {
  client.on("ready", () => {
    // This event will run if the bot starts, and logs in, successfully.
    Logger.print(`Bot has started!`);
    Status.watchStatus(client, (message) => {
      Logger.log("Setting bot activity: ", message);
      client.user.setActivity(message);
    });
  });
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

function validateMessage(prefix, { id, author, content }) {
  if (!id) {
    return false;
  }

  // It's good practice to ignore other bots. This also makes your bot ignore itself
  // and not get into a spam loop (we call that "botception").
  if (author.bot) {
    return false;
  }

  // Also good practice to ignore any message that does not start with our prefix,
  // which is set in the configuration file.
  return content.startsWith(prefix);
}

function cacheMessage(cache, skipCache, id, message) {
  if (!skipCache) {
    cache.insert(id, message);
  }
  cache.invalidate();
}

function sendMessage({ skipCache, cache, messageId, channel, messageText }) {
  // Edit an existing message
  const oldMessage = cache.get(messageId);
  if (oldMessage) {
    Logger.log("Update old message with new content: ", messageId);
    oldMessage
      .edit(messageText)
      .then((message) => cacheMessage(cache, skipCache, messageId, message))
      .catch((error) => {
        Logger.error(error, "Unable to update message: ", messageId);
      });
    return;
  }

  // Send a new message
  Logger.log("Send new message for id: ", messageId);
  channel
    .send(messageText)
    .then((message) => cacheMessage(cache, skipCache, messageId, message))
    .catch((error) => {
      Logger.error(error, `Unable to send message: "${messageText}"`);
    });
}

function isReverseLookupCommand(prefix, content) {
  return content.startsWith(prefix) && content.slice(1).startsWith(prefix);
}

function botWatchMessageUpdates(client, { prefix, cache }) {
  Logger.log("Watching for message updates");
  client.on("messageUpdate", (oldMessage, newMessage) => {
    const { id, content, channel } = newMessage;
    if (!validateMessage(prefix, newMessage)) {
      return;
    }

    // Make this an option input
    const includeNews = true;

    if (isReverseLookupCommand(prefix, content)) {
      const query = contentToQuery(prefix, content);
      reverseLookup(query, {
        prefix,
        cache,
        channel,
        id,
        includeNews,
      });
      return;
    }

    const symbols = contentToSymbols(prefix, content);
    lookupSymbols(symbols, { prefix, cache, channel, id, includeNews });
  });
}

function botWatchMessages(client, { prefix, cache }) {
  Logger.log("Watching for messages");
  client.on("message", (message) => {
    const { id, content, channel } = message;

    // This event will run on every single message received, from any channel or DM.
    if (!validateMessage(prefix, message)) {
      return;
    }

    // Make this an option input
    const includeNews = false;

    if (isReverseLookupCommand(prefix, content)) {
      const query = contentToQuery(prefix, content);
      reverseLookup(query, {
        prefix,
        cache,
        channel,
        id,
        includeNews,
      });
      return;
    }

    const symbols = contentToSymbols(prefix, content);
    lookupSymbols(symbols, { prefix, cache, channel, id, includeNews });
  });
}

function handleCommand(cache, channel, id, command) {
  command
    .then((result) => {
      Logger.log("Command result: ", result);
      const parsed = MessageParser.parse(result);
      sendMessage({
        skipCache: false,
        cache,
        messageId: id,
        channel,
        messageText: parsed,
      });
    })
    .catch((error) => {
      sendMessage({
        skipCache: true,
        cache,
        messageId: id,
        channel,
        messageText: error.message,
      });
    });
}

function handleHelp(prefix, cache, channel, id) {
  // Looks weird but this lines up.
  const message = codeBlock(`Beep Boop.
  
  ${prefix}             This help.
  ${prefix}${prefix}            This help.

  ${prefix} SYMBOL...   Price information for <SYMBOL>
  ${prefix}${prefix} QUERY      Query results for <QUERY>
  `);
  sendMessage({
    skipCache: false,
    cache,
    messageId: id,
    channel,
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

function reverseLookup(query, { prefix, cache, channel, id, includeNews }) {
  if (!query || query.length <= 0) {
    handleHelp(prefix, cache, channel, id);
  } else {
    handleCommand(
      cache,
      channel,
      id,
      Commands.query({ query, fuzzy: true }).then(attachNews(includeNews, true))
    );
  }
}

function lookupSymbols(symbols, { prefix, cache, channel, id, includeNews }) {
  if (!symbols || symbols.length <= 0) {
    handleHelp(prefix, cache, channel, id);
  } else {
    handleCommand(
      cache,
      channel,
      id,
      Commands.lookup({ symbols }).then(attachNews(includeNews, true))
    );
  }
}

function initializeBot(prefix) {
  const client = new Discord.Client();
  const cache = Cache.create(STALE_OFFSET_MS);
  botWatchReady(client);
  botWatchMessages(client, { prefix, cache });
  botWatchMessageUpdates(client, { prefix, cache });
  return function loginBot(token) {
    client.login(token);
  };
}

// Log the bot in
module.exports = {
  login: function login(config) {
    Logger.print(`Starting bot...`);
    Logger.print(`Responds to: '${config.prefix}'`);
    config.token
      ? Logger.print(`Has authentication token`)
      : Logger.error(`Missing authentication token!!`);
    Logger.print();
    const loginBot = initializeBot(config.prefix);
    loginBot(config.token);
  },
};
