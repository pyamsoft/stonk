import { initializeBot } from "./bot";
import { sourceConfig } from "./config";
import { newLogger } from "./logger";

const logger = newLogger("StonkBot");

const config = sourceConfig();
const bot = initializeBot(config);

const watcher = bot.watchMessages();

bot.login().then((loggedIn) => {
  if (loggedIn) {
    logger.log("Bot logged in: ", loggedIn);
  } else {
    logger.warn("Bot failed to login!");
    watcher.stop();
  }
});
