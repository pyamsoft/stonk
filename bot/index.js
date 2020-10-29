const Discord = require("discord.js");
const Logger = require("../logger");
const Status = require("./status");
const Cache = require("./cache");
const Handler = require("./handler");
const WatchList = require("./watch");

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

  client.on("error", (error) => {
    Logger.error(error, "Bot has encountered an error!");
    client.user.setActivity("WEE WOO ERROR");

    // Clear all the handlers
    Status.stopWatchingStatus(client);
    WatchList.clearWatchList(client);
  });
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
  if (!skipCache && id) {
    cache.insert(id, message);
  }
  cache.invalidate();
}

function sendMessage(cache, channel, { skipCache, messageId, messageText }) {
  // Edit an existing message
  if (messageId) {
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

function handleWatchSymbols(client, channel, symbols) {
  for (const symbol of Object.keys(symbols)) {
    const bounds = symbols[symbol];
    if (!bounds) {
      continue;
    }

    const { low, high } = bounds;
    if (!low || !high) {
      continue;
    }

    WatchList.watchSymbol(client, {
      symbol,
      low,
      high,
      interval: 15,
      command: () => {
        Logger.log("Perform watch command lookup: ", symbol, low, high);
      },
    });
  }
}

function handleExtras(client, channel, extras) {
  Logger.log("Handle result extras", extras);
  const { watchSymbols } = extras;
  if (watchSymbols) {
    handleWatchSymbols(client, channel, watchSymbols);
  }
}

function botWatchMessageUpdates(client, { prefix, cache }) {
  Logger.log("Watching for message updates");
  client.on("messageUpdate", (oldMessage, newMessage) => {
    const { id, content, channel } = newMessage;
    if (!validateMessage(prefix, newMessage)) {
      return;
    }

    Handler.handle(
      {
        prefix,
        content,
        id,
      },
      (payload, extras) => {
        sendMessage(cache, channel, payload);
        handleExtras(client, channel, extras);
      }
    );
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

    Handler.handle(
      {
        prefix,
        content,
        id,
      },
      (payload, extras) => {
        sendMessage(cache, channel, payload);
        handleExtras(client, channel, extras);
      }
    );
  });
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
