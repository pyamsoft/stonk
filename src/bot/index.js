const Discord = require("discord.js");
const Logger = require("../logger");
const Market = require("./market");
const Cache = require("./cache");
const Handler = require("./handler");
const WatchList = require("./watch");
const StopWatch = require("./model/stopwatch");
const EventEmitter = require("./model/eventemitter");
const Status = require("./model/status");

function createMarketCallback(status, stopWatch) {
  return function onMarketUpdated({ open, message }) {
    Logger.log("Setting bot activity: ", message);
    status.setActivity(message);

    if (!open) {
      Logger.log("Clear watch list when market is closed");
      WatchList.clearWatchList(stopWatch);
    }
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

function cacheMessage(cache, skipCache, id, message) {
  if (!skipCache) {
    cache.insert(id || message.id, message);
  }
  cache.invalidate();
}

function sendMessage(channel, { cache, skipCache, messageId, messageText }) {
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

function handleStopWatchSymbols({ stopWatch, stopWatching }) {
  for (const symbol of Object.keys(stopWatching)) {
    const stop = stopWatching[symbol];
    if (!stop) {
      continue;
    }

    Logger.log("Stop watching symbol for price points: ", symbol);
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
    Logger.log("Watch symbol for price points: ", symbol, low, high, interval);
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
  Logger.log("Handle result extras", extras);
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
    Logger.print(`Bot has started!`);
    Market.watchMarket(stopWatch, marketCallback);
  });

  emitter.on("error", (error) => {
    Logger.error(error, "Bot has encountered an error!");
    status.setActivity("WEE WOO ERROR");

    // Clear all the handlers
    Logger.log("Stop watching status on error");
    Market.stopWatchingMarket(stopWatch);

    Logger.log("Clear watch list on error");
    WatchList.clearWatchList(stopWatch);
  });
}

function spaceOutMessageLogs() {
  Logger.log();
  Logger.log();
  Logger.log("=============");
}

function botWatchMessageUpdates(
  prefix,
  { cache, emitter, stopWatch, marketCallback }
) {
  Logger.log("Watching for message updates");
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
  Logger.log("Watching for messages");
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

function initializeBot(prefix, options) {
  // Models
  const client = new Discord.Client();
  const cache = Cache.create(2 * 60 * 60 * 1000);
  const emitter = EventEmitter.create(client);
  const status = Status.create(client);
  const stopWatch = StopWatch.create(client);
  const marketCallback = createMarketCallback(status, stopWatch);

  // Event listeners
  botWatchReady({ emitter, status, stopWatch, marketCallback });
  botWatchMessages(prefix, { cache, emitter, stopWatch, marketCallback });
  botWatchMessageUpdates(prefix, { cache, emitter, stopWatch, marketCallback });

  // Login
  return function loginBot(token) {
    client.login(token);
  };
}

function printEnv(config) {
  Logger.print(`Starting bot...`);
  Logger.print(`Responds to: '${config.prefix}'`);
  config.token
    ? Logger.print(`Has authentication token`)
    : Logger.error(`Missing authentication token!!`);
  Logger.print();
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
