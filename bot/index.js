const Discord = require("discord.js");
const Lookup = require("./lookup");
const Status = require("./status");

// 2 hours
const STALE_OFFSET_MS = 2 * 60 * 60 * 1000;

function botWatchReady(client) {
  client.on("ready", () => {
    // This event will run if the bot starts, and logs in, successfully.
    console.log(`Bot has started!`);
    Status.watchStatus(client, (message) => {
      client.user.setActivity(message);
    });
  });
}

function contentToSymbols(prefix, content) {
  // Here we separate our "command" name, and our "arguments" for the command.
  // e.g. if we have the message "+say Is this the real life?" , we'll get the following:
  // symbol = say
  // args = ["Is", "this", "the", "real", "life?"]
  const args = content.slice(prefix.length).trim().split(/ +/g);
  const symbol = args.shift().toUpperCase();
  let symbols = [];
  if (symbol) {
    symbols.push(symbol);
  }
  symbols = [...symbols, ...args];
  return symbols;
}

function validateMessage({ prefix, id, author, content }) {
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
  if (!content.startsWith(prefix)) {
    return false;
  }

  return true;
}

function insertIntoMessageMap(ignore, map, id, message) {
  const now = new Date();
  if (!ignore) {
    map[id] = {
      message,
      lastUsed: now,
    };
  }

  // Clear out any stale messages
  for (const key of Object.keys(map)) {
    const old = map[key];
    if (old) {
      const { lastUsed } = old;
      if (now.valueOf() - STALE_OFFSET_MS > lastUsed.valueOf()) {
        map[key] = null;
      }
    }
  }
}

function sendMessage({
  doNotCacheMessage,
  messageMap,
  messageId,
  channel,
  messageText,
}) {
  // Edit an existing message
  if (messageId) {
    const oldMessage = messageMap[messageId];
    if (oldMessage) {
      oldMessage.message
        .edit(messageText)
        .then((message) =>
          insertIntoMessageMap(
            doNotCacheMessage,
            messageMap,
            messageId,
            message
          )
        )
        .catch((error) => {
          console.error(error, "Unable to update message: ", messageId);
        });
      return;
    }
  }

  // Send a new message
  channel
    .send(messageText)
    .then((message) =>
      insertIntoMessageMap(doNotCacheMessage, messageMap, messageId, message)
    )
    .catch((error) => {
      console.error(error, `Unable to send message: "${messageText}"`);
    });
}

function botWatchMessageUpdates(client, { prefix, messageMap }) {
  if (!prefix) {
    console.warn(`Missing prefix defined in config.json`);
    return;
  }

  client.on("messageUpdate", (oldMessage, newMessage) => {
    const { id: oldId, author: oldAuthor, content: oldContent } = oldMessage;
    if (
      !validateMessage({
        prefix,
        id: oldId,
        author: oldAuthor,
        content: oldContent,
      })
    ) {
      return;
    }

    const {
      id: newId,
      author: newAuthor,
      content: newContent,
      channel,
    } = newMessage;
    if (
      !validateMessage({
        prefix,
        id: newId,
        author: newAuthor,
        content: newContent,
      })
    ) {
      return;
    }

    const newSymbols = contentToSymbols(prefix, newContent);
    Lookup.lookup({ symbols: newSymbols }, ({ message, isError }) =>
      sendMessage({
        doNotCacheMessage: isError,
        messageMap,
        messageId: newId,
        channel,
        messageText: message,
      })
    );
  });
}

function botWatchMessages(client, { prefix, messageMap }) {
  if (!prefix) {
    console.warn(`Missing prefix defined in config.json`);
    return;
  }

  client.on("message", ({ id, author, content, channel }) => {
    // This event will run on every single message received, from any channel or DM.
    if (!validateMessage({ prefix, id, author, content })) {
      return;
    }

    const symbols = contentToSymbols(prefix, content);
    Lookup.lookup({ symbols }, ({ message, isError }) =>
      sendMessage({
        doNotCacheMessage: isError,
        messageMap,
        messageId: id,
        channel,
        messageText: message,
      })
    );
  });
}

function initializeBot(prefix) {
  const client = new Discord.Client();
  const messageMap = {};
  botWatchReady(client);
  botWatchMessages(client, { prefix, messageMap });
  botWatchMessageUpdates(client, { prefix, messageMap });
  return (token) => client.login(token);
}

// Log the bot in
module.exports = {
  login: (config) => {
    const login = initializeBot(config.prefix);
    login(config.token);
  },
};
