import { initializeBot } from "./bot";
import { sourceConfig } from "./config";
import { newLogger } from "./bot/logger";
import { HelpHandler } from "./commands/help";
import { QuoteHandler } from "./commands/quote";
import { MessageEventTypes } from "./bot/model/MessageEventType";

const logger = newLogger("StonkBot");

const config = sourceConfig();
const bot = initializeBot(config);

const createHelpHandler = bot.addHandler(MessageEventTypes.CREATE, HelpHandler);
const updateHelpHandler = bot.addHandler(MessageEventTypes.UPDATE, HelpHandler);
const createQuoteHandler = bot.addHandler(
  MessageEventTypes.CREATE,
  QuoteHandler
);
const updateQuoteHandler = bot.addHandler(
  MessageEventTypes.UPDATE,
  QuoteHandler
);

const watcher = bot.watchMessages(() => {
  bot.removeHandler(createHelpHandler);
  bot.removeHandler(updateHelpHandler);
  bot.removeHandler(createQuoteHandler);
  bot.removeHandler(updateQuoteHandler);
});

bot.login().then((loggedIn) => {
  if (loggedIn) {
    logger.log("Bot logged in: ", loggedIn);
  } else {
    logger.warn("Bot failed to login!");
    watcher.stop();
  }
});
