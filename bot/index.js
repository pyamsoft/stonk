const Discord = require("discord.js");
const Logger = require("../logger");
const Status = require("./core/status");
const Cache = require("./core/cache");
const Handler = require("./handler");

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

function sendMessage(cache, channel, { skipCache, messageId, messageText }) {
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

function botWatchMessageUpdates(client, { prefix, cache }) {
  Logger.log("Watching for message updates");
  client.on("messageUpdate", (oldMessage, newMessage) => {
    const { id, content, channel } = newMessage;
    if (!validateMessage(prefix, newMessage)) {
      return;
    }

    Handler.handle({ prefix, content, id }, (payload) => {
      sendMessage(cache, channel, payload);
    });
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

    Handler.handle({ prefix, content, id }, (payload) => {
      sendMessage(cache, channel, payload);
    });
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
