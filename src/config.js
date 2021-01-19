// Parse the .env file if one exists
require("dotenv").config();

module.exports = {
  prefix: process.env.BOT_PREFIX || "$",
  token: process.env.BOT_TOKEN || null,
};
