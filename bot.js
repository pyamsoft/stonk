const Discord = require("discord.js");
const YFinance = require("./yfinance");
const config = require("./config.json");
const client = new Discord.Client();

function updateActivity() {
  const count = client.guilds.cache.size;
  client.user.setActivity(
    `Serving ${count} ${count === 1 ? "server" : "servers"}`
  );
}

client.on("ready", () => {
  // This event will run if the bot starts, and logs in, successfully.
  console.log(
    `Bot has started, with ${client.users.cache.size} users, in ${client.channels.cache.size} channels of ${client.guilds.cache.size} guilds.`
  );
  // Example of changing the bot's playing game to something useful. `client.user` is what the
  // docs refer to as the "ClientUser".
  updateActivity();
});

client.on("guildCreate", (guild) => {
  // This event triggers when the bot joins a guild.
  console.log(
    `New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`
  );
  updateActivity();
});

client.on("guildDelete", (guild) => {
  // this event triggers when the bot is removed from a guild.
  console.log(`I have been removed from: ${guild.name} (id: ${guild.id})`);
  updateActivity();
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
