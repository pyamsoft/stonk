/*
 * Copyright 2024 pyamsoft
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

import {
  MessageHandler,
  messageHandlerHelpText,
} from "../bot/message/MessageHandler";
import { newLogger } from "../bot/logger";
import { BotConfig } from "../config";
import { outputHelpText } from "./outputs/help";
import { SymbolCommand } from "./symbol";

const TAG = "HelpHandler";
const logger = newLogger(TAG);

export const HelpHandler: MessageHandler = {
  tag: TAG,

  handle: function (
    config: BotConfig,
    command: {
      currentCommand: SymbolCommand;
      oldCommand?: SymbolCommand;
    },
  ) {
    // Only handle help
    const { currentCommand } = command;
    if (!currentCommand.isHelpCommand) {
      return;
    }

    logger.log("Handle help message", currentCommand);
    return Promise.resolve(messageHandlerHelpText(outputHelpText(config)));
  },
};
