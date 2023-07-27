/*
 * Copyright 2023 pyamsoft
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { initializeBot } from "./bot";
import { sourceConfig } from "./config";
import { newLogger } from "./bot/logger";
import { HelpHandler } from "./commands/help";
import { QuoteHandler } from "./commands/quote";
import { MessageEventTypes } from "./bot/model/MessageEventType";
import { LookupHandler } from "./commands/lookup";
import { RecommendHandler } from "./commands/recommend";
import { registerPeriodicHealthCheck } from "./health";

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
const createLookupHandler = bot.addHandler(
  MessageEventTypes.CREATE,
  LookupHandler
);
const updateLookupHandler = bot.addHandler(
  MessageEventTypes.UPDATE,
  LookupHandler
);
const createRecHandler = bot.addHandler(
  MessageEventTypes.CREATE,
  RecommendHandler
);
const updateRecHandler = bot.addHandler(
  MessageEventTypes.UPDATE,
  RecommendHandler
);

const health = registerPeriodicHealthCheck(config.healthCheckUrl);

const watcher = bot.watchMessages(() => {
  health.unregister();

  bot.removeHandler(createHelpHandler);
  bot.removeHandler(updateHelpHandler);
  bot.removeHandler(createQuoteHandler);
  bot.removeHandler(updateQuoteHandler);
  bot.removeHandler(createLookupHandler);
  bot.removeHandler(updateLookupHandler);
  bot.removeHandler(createRecHandler);
  bot.removeHandler(updateRecHandler);
});

bot.login().then((loggedIn) => {
  if (loggedIn) {
    logger.log("Bot logged in: ", loggedIn);
  } else {
    logger.warn("Bot failed to login!");
    watcher.stop();
  }
});
