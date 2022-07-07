import { DiscordBot, initializeBot } from "./bot";
import { sourceConfig } from "./config";
import { newLogger } from "./logger";

const logger = newLogger("StonkBot");

const initialize = function (bot: DiscordBot) {
  logger.log("Bot logged in: ", bot);
};

const config = sourceConfig();
const bot = initializeBot(config);

bot.login().then((loggedIn) => {
  logger.log("Bot logged in: ", loggedIn);
  if (!loggedIn) {
    logger.warn("Bot failed to login!");
    return;
  }

  initialize(bot);
});
