const Discord = require("discord.js");
const YFinance = require("./yfinance");
const config = require("../config.json");
const Status = require("./status");
const client = new Discord.Client();

client.on("ready", () => {
  // This event will run if the bot starts, and logs in, successfully.
  console.log(
    `Bot has started, with ${client.users.cache.size} users, in ${client.channels.cache.size} channels of ${client.guilds.cache.size} guilds.`
  );

  Status.watchStatus((message) => {
    client.user.setActivity(message);
  });
});

client.on("message", ({ author, content, channel }) => {
  // This event will run on every single message received, from any channel or DM.

  // It's good practice to ignore other bots. This also makes your bot ignore itself
  // and not get into a spam loop (we call that "botception").
  if (author.bot) {
    return;
  }

  // Also good practice to ignore any message that does not start with our prefix,
  // which is set in the configuration file.
  if (!content.startsWith(config.prefix)) {
    return;
  }

  // Here we separate our "command" name, and our "arguments" for the command.
  // e.g. if we have the message "+say Is this the real life?" , we'll get the following:
  // symbol = say
  // args = ["Is", "this", "the", "real", "life?"]
  const args = content.slice(config.prefix.length).trim().split(/ +/g);
  const symbol = args.shift().toUpperCase();
  let symbols = [];
  if (symbol) {
    symbols.push(symbol);
  }
  symbols = [...symbols, ...args];

  YFinance.lookup(symbols, (message) => {
    channel.send(message);
  });
});

// Log the bot in
module.exports = {
  login: () => {
    client.login(config.token);
  },
};
