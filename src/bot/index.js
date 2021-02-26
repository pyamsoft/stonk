const Discord = require("discord.js");
const Logger = require("../logger");
const Market = require("./market");
const Cache = require("./cache");
const Handler = require("./handler");
const WatchList = require("./watch");
const StopWatch = require("./model/stopwatch");
const EventEmitter = require("./model/eventemitter");
const Status = require("./model/status");

const TYPE_STRING = typeof "";
const logger = Logger.tag("bot/index");

function createMarketCallback(status) {
  return function onMarketUpdated({ message }) {
    logger.log("Setting bot activity: ", message);
    status.setActivity(message);
  };
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

function handleStopWatchSymbols({ stopWatch, stopWatching }) {
  for (const symbol of Object.keys(stopWatching)) {
    const stop = stopWatching[symbol];
    if (!stop) {
      continue;
    }

    logger.log("Stop watching symbol for price points: ", symbol);
    WatchList.stopWatchingSymbol(stopWatch, { symbol });
  }
}

function handleWatchSymbols(
  prefix,
  channel,
  { author, cache, stopWatch, symbols, stopWatching }
) {
  for (const symbol of Object.keys(symbols)) {
    const stop = stopWatching[symbol];
    // If we want this to stop watching, we unregister it instead of registering it here.
    if (stop) {
      WatchList.stopWatchingSymbol(stopWatch, { symbol });
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
    WatchList.watchSymbol(stopWatch, {
      symbol,
      low,
      high,
      interval,
      command: (s, l, h) => {
        Handler.notify(
          prefix,
          {
            author,
            stopWatch,
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

function handleExtras(prefix, channel, { author, cache, stopWatch, extras }) {
  logger.log("Handle result extras", extras);
  const { watchSymbols, stopWatchSymbols } = extras;
  if (stopWatchSymbols) {
    handleStopWatchSymbols({
      stopWatch,
      stopWatching: stopWatchSymbols,
    });
  }

  if (watchSymbols) {
    handleWatchSymbols(prefix, channel, {
      author,
      cache,
      stopWatch,
      symbols: watchSymbols,
      stopWatching: stopWatchSymbols,
    });
  }
}

function botWatchReady({ emitter, status, stopWatch, marketCallback }) {
  emitter.on("ready", () => {
    // This event will run if the bot starts, and logs in, successfully.
    logger.print(`Bot has started!`);
    Market.watchMarket(stopWatch, marketCallback);
  });

  emitter.on("error", (error) => {
    logger.error(error, "Bot has encountered an error!");
    status.setActivity("WEE WOO ERROR");

    // Clear all the handlers
    logger.log("Stop watching status on error");
    Market.stopWatchingMarket(stopWatch);

    logger.log("Clear watch list on error");
    WatchList.clearWatchList(stopWatch);
  });
}

function spaceOutMessageLogs() {
  logger.log();
  logger.log();
  logger.log("=============");
}

function botWatchMessageUpdates(
  prefix,
  { cache, emitter, stopWatch, marketCallback }
) {
  logger.log("Watching for message updates");
  emitter.on("messageUpdate", (oldMessage, newMessage) => {
    const { id, content, channel, author } = newMessage;
    if (!validateMessage(prefix, newMessage)) {
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
          stopWatch,
          data: result,
          extras,
        });
      }
    );
  });
}

function botWatchMessages(
  prefix,
  { cache, emitter, stopWatch, marketCallback }
) {
  logger.log("Watching for messages");
  emitter.on("message", (message) => {
    const { id, content, channel, author } = message;

    // This event will run on every single message received, from any channel or DM.
    if (!validateMessage(prefix, message)) {
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
          stopWatch,
          extras,
        });
      }
    );
  });
}

function initializeBot(prefix) {
  // Models
  const client = new Discord.Client();
  const cache = Cache.create(2 * 60 * 60 * 1000);
  const emitter = EventEmitter.create(client);
  const status = Status.create(client);
  const stopWatch = StopWatch.create(client);
  const marketCallback = createMarketCallback(status);

  // Event listeners
  botWatchReady({ emitter, status, stopWatch, marketCallback });
  botWatchMessages(prefix, {
    cache,
    emitter,
    stopWatch,
    marketCallback,
  });
  botWatchMessageUpdates(prefix, {
    cache,
    emitter,
    stopWatch,
    marketCallback,
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
