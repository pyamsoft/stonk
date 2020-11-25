let config;
try {
  config = require("./.env");
} catch (e) {
  // No config, running on heroku?
  config = {
    prefix: process.env.BOT_PREFIX || "$",
    token: process.env.BOT_TOKEN || null,
  };
}

module.exports = config;
