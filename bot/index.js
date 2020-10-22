const Discord = require("discord.js");
const Lookup = require("./lookup");
const Status = require("./status");

function botWatchReady(client) {
  client.on("ready", () => {
    // This event will run if the bot starts, and logs in, successfully.
    console.log(`Bot has started!`);
    Status.watchStatus(client, (message) => {
      client.user.setActivity(message);
    });
  });
}

function botWatchMessages(client, prefix) {
  if (!prefix) {
    console.warn(`Missing prefix defined in config.json`);
    return;
  }

  client.on("message", ({ author, content, channel }) => {
    // This event will run on every single message received, from any channel or DM.

    // It's good practice to ignore other bots. This also makes your bot ignore itself
    // and not get into a spam loop (we call that "botception").
    if (author.bot) {
      return;
    }

    // Also good practice to ignore any message that does not start with our prefix,
    // which is set in the configuration file.
    if (!content.startsWith(prefix)) {
      return;
    }

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

    Lookup.lookup({ symbol: symbols }, (message) => channel.send(message));
  });
}

function initializeBot(config) {
  const client = new Discord.Client();
  botWatchReady(client);
  botWatchMessages(client, config.prefix);
  return (token) => client.login(token);
}

// Log the bot in
module.exports = {
  login: (config) => {
    const login = initializeBot(config);
    login(config.token);
  },
};
