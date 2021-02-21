// Parse the .env file if one exists
require("dotenv").config();

module.exports = {
  BotConfig: {
    prefix: process.env.BOT_PREFIX || "$",
    token: process.env.BOT_TOKEN || null,
  },

  TdConfig: {
    key: process.env.TD_API_KEY || null,
  },
};
