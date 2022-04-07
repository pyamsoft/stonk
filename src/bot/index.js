const { Client, Intents } = require("discord.js");
const Logger = require("../logger");
const Market = require("./market");
const Cache = require("./cache");
const Handler = require("./handler");
const WatchList = require("./watch");
const Status = require("./model/status");
const EventEmitter = require("./eventemitter");

const TYPE_STRING = typeof "";
const logger = Logger.tag("bot/index");

function createMarketCallback(status) {
  return function onMarketUpdated({ message }) {
    logger.log("Setting bot activity: ", message);
    status.setActivity(message);
  };
}

function validateMessage(
  prefix,
  { id, author, content },
  channel,
  optionalSpecificChannel
) {
  if (!id) {
    return false;
  }

  // It's good practice to ignore other bots. This also makes your bot ignore itself
  // and not get into a spam loop (we call that "botception").
  if (author.bot) {
    return false;
  }

  // Missing channel
  if (!channel) {
    return false;
  }

  // Make sure the message has a text channel or a dm
  if (channel.type !== "text" && channel.type !== "dm") {
    return false;
  }

  // If the bot only watches specific channels, make sure we enforce it here.
  if (optionalSpecificChannel) {
    if (channel.id !== optionalSpecificChannel) {
      return false;
    }
  }

  // Also good practice to ignore any message that does not start with our prefix,
  // which is set in the configuration file.
  return content.startsWith(prefix);
}

async function sendMessage(
  channel,
  { cache, skipCache, messageId, messageText }
) {
  if (typeof messageText === TYPE_STRING) {
    // String direct messages are never cached and just sent over plainly.
    await postMessage(channel, {
      cache,
      skipCache: true,
      messageId,
      stockSymbol: null,
      messageText,
    });
    return;
  }

  const { error, data } = messageText;
  if (error) {
    await postMessage(channel, {
      cache,
      skipCache: true,
      messageId,
      stockSymbol: null,
      messageText: error,
    });
    return;
  }

  const newSymbols = Object.keys(data);
  const allOldData = cache.getAll(messageId);
  if (allOldData) {
    const oldSymbols = Object.keys(allOldData);

    for await (const symbol of oldSymbols) {
      if (!newSymbols.includes(symbol)) {
        const oldMessage = allOldData[symbol];
        if (oldMessage) {
          await oldMessage
            .delete()
            .then(() => {
              logger.log("Deleted old message: ", symbol, oldMessage.id);
              cache.remove(messageId, symbol);
            })
            .catch((error) => {
              logger.error(
                error,
                "Failed to delete old message",
                oldMessage.id
              );
            });
        }
      }
    }
  }

  for await (const stockSymbol of newSymbols) {
    const messageContent = data[stockSymbol];
    await postMessage(channel, {
      cache,
      skipCache,
      messageId,
      stockSymbol,
      messageText: messageContent,
    });
  }
}
function postMessage(
  channel,
  { cache, skipCache, messageId, stockSymbol, messageText }
) {
  const oldMessage = cache.get(messageId, stockSymbol);
  if (oldMessage) {
    return new Promise((resolve) => {
      oldMessage
        .edit(messageText)
        .then((message) => {
          logger.log(
            "Update old message with new content: ",
            stockSymbol,
            oldMessage.id
          );
          if (!skipCache) {
            cache.insert(messageId, stockSymbol, message);
          }
          resolve(message);
        })
        .catch((error) => {
          logger.error(
            error,
            "Unable to update message: ",
            stockSymbol,
            oldMessage.id
          );
          resolve(null);
        });
    });
  }

  // Send a new message
  return new Promise((resolve) => {
    channel
      .send(messageText)
      .then((message) => {
        logger.log("Send new message for id: ", stockSymbol, message.id);
        if (!skipCache) {
          cache.insert(messageId, stockSymbol, message);
        }
        resolve(message);
      })
      .catch((error) => {
        logger.error(
          error,
          `Unable to send message: `,
          stockSymbol,
          messageText
        );
        resolve(null);
      });
  });
}

function handleStopWatchSymbols({ stopWatching }) {
  for (const symbol of Object.keys(stopWatching)) {
    const stop = stopWatching[symbol];
    if (!stop) {
      continue;
    }

    logger.log("Stop watching symbol for price points: ", symbol);
    WatchList.stopWatchingSymbol({ symbol });
  }
}

function handleWatchSymbols(
  prefix,
  channel,
  { author, cache, symbols, stopWatching }
) {
  for (const symbol of Object.keys(symbols)) {
    const stop = stopWatching[symbol];
    // If we want this to stop watching, we unregister it instead of registering it here.
    if (stop) {
      WatchList.stopWatchingSymbol({ symbol });
      continue;
    }

    const bounds = symbols[symbol];
    if (!bounds) {
      continue;
    }

    const { low, high } = bounds;
    if (!low || !high) {
      continue;
    }

    const interval = 45;
    logger.log("Watch symbol for price points: ", symbol, low, high, interval);
    WatchList.watchSymbol({
      symbol,
      low,
      high,
      interval,
      command: (s, l, h) => {
        Handler.notify(
          prefix,
          {
            author,
            symbol: s,
            low: l,
            high: h,
          },
          (message) => {
            const { result, ...messagePayload } = message;
            if (result) {
              sendMessage(channel, { cache, ...messagePayload });
            }
          }
        );
      },
    });
  }
}

function handleExtras(prefix, channel, { author, cache, extras }) {
  logger.log("Handle result extras", extras);
  const { watchSymbols, stopWatchSymbols } = extras;
  if (stopWatchSymbols) {
    handleStopWatchSymbols({
      stopWatching: stopWatchSymbols,
    });
  }

  if (watchSymbols) {
    handleWatchSymbols(prefix, channel, {
      author,
      cache,
      symbols: watchSymbols,
      stopWatching: stopWatchSymbols,
    });
  }
}

function botWatchReady(emitter, { status, marketCallback }) {
  emitter.on("ready", () => {
    // This event will run if the bot starts, and logs in, successfully.
    logger.print(`Bot has started!`);
    Market.watchMarket(marketCallback);
  });

  emitter.on("error", (error) => {
    logger.error(error, "Bot has encountered an error!");
    status.setActivity("WEE WOO ERROR");

    // Clear all the handlers
    logger.log("Stop watching status on error");
    Market.stopWatchingMarket();

    logger.log("Clear watch list on error");
    WatchList.clearWatchList();
  });
}

function spaceOutMessageLogs() {
  logger.log();
  logger.log();
  logger.log("=============");
}

function botWatchMessageUpdates(
  emitter,
  prefix,
  { cache, marketCallback, specificChannel }
) {
  logger.log("Watching for message updates");
  emitter.on("messageUpdate", (oldMessage, newMessage) => {
    const { id, content, channel, author } = newMessage;
    if (!validateMessage(prefix, newMessage, channel, specificChannel)) {
      return;
    }

    spaceOutMessageLogs();

    // Handle the message
    Handler.handle(
      prefix,
      {
        content,
        id,
      },
      (payload, extras) => {
        // Update the bot status
        Market.updateMarket(marketCallback);

        const { result } = payload;
        sendMessage(channel, { cache, ...payload });
        handleExtras(prefix, channel, {
          author,
          cache,
          data: result,
          extras,
        });
      }
    );
  });
}

function botWatchMessages(
  emitter,
  prefix,
  { cache, marketCallback, specificChannel }
) {
  logger.log("Watching for messages");
  emitter.on("message", (message) => {
    const { id, content, channel, author } = message;

    // This event will run on every single message received, from any channel or DM.
    if (!validateMessage(prefix, message, channel, specificChannel)) {
      return;
    }

    spaceOutMessageLogs();

    // Handle the message
    Handler.handle(
      prefix,
      {
        content,
        id,
      },
      (payload, extras) => {
        // Update the bot status
        Market.updateMarket(marketCallback);

        sendMessage(channel, { cache, ...payload });
        handleExtras(prefix, channel, {
          author,
          cache,
          extras,
        });
      }
    );
  });
}

function initializeBot(prefix, { specificChannel }) {
  // Models
  const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.DIRECT_MESSAGES],
  });
  const cache = Cache.create(2 * 60 * 60 * 1000);
  const emitter = EventEmitter.create(client);
  const status = Status.create(client);
  const marketCallback = createMarketCallback(status);

  // Event listeners
  botWatchReady(emitter, { status, marketCallback });
  botWatchMessages(emitter, prefix, {
    cache,
    marketCallback,
    specificChannel,
  });
  botWatchMessageUpdates(emitter, prefix, {
    cache,
    marketCallback,
    specificChannel,
  });

  // Login
  return function loginBot(token) {
    client.login(token);
  };
}

function printEnv(config) {
  logger.print(`Starting bot...`);
  logger.print(`Responds to: '${config.prefix}'`);
  config.token
    ? logger.print(`Has authentication token`)
    : logger.error(`Missing authentication token!!`);
  logger.print();
}

// Log the bot in
module.exports = {
  login: function login(config) {
    printEnv(config);
    const { prefix, token, ...rest } = config;
    const loginBot = initializeBot(prefix, rest);
    loginBot(token);
  },
};
