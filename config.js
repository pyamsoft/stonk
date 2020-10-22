let config;
try {
  config = require("./config.json");
} catch (e) {
  console.warn(e, "No config.json found. Fall back to ENV");
  config = {
    prefix: process.env.BOT_PREFIX || "$",
    token: process.env.BOT_TOKEN || null,
  };
}

module.exports = config;
