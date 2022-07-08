import { initializeBot } from "./bot";
import { sourceConfig } from "./config";
import { newLogger } from "./logger";
import { HelpHandler } from "./bot/message/handler/help";
import { LookupHelpHandler } from "./bot/message/handler/lookuphelp";

const logger = newLogger("StonkBot");

const config = sourceConfig();
const bot = initializeBot(config);

const helpHandler = bot.addHandler(HelpHandler);
const lookupHandler = bot.addHandler(LookupHelpHandler);

const watcher = bot.watchMessages(() => {
  bot.removeHandler(helpHandler);
  bot.removeHandler(lookupHandler);
});

bot.login().then((loggedIn) => {
  if (loggedIn) {
    logger.log("Bot logged in: ", loggedIn);
  } else {
    logger.warn("Bot failed to login!");
    watcher.stop();
  }
});
