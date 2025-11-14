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
  messageHandlerError,
  messageHandlerOutput,
} from "../bot/message/MessageHandler";
import { newLogger } from "../bot/logger";
import { BotConfig } from "../config";
import { SymbolCommand } from "./symbol";
import { lookupRecommendations } from "./work/recommend";

const TAG = "RecommendHandler";
const logger = newLogger(TAG);

export const RecommendHandler: MessageHandler = {
  tag: TAG,

  handle: function (
    config: BotConfig,
    command: {
      currentCommand: SymbolCommand;
      oldCommand?: SymbolCommand;
    },
  ) {
    // Do not handle help
    const { currentCommand } = command;
    if (currentCommand.isHelpCommand) {
      return;
    }

    const { prefix } = config;
    const { symbols } = currentCommand;

    const recSymbols = symbols.filter((s) => {
      // Quote lookups have a triple prefix
      return (
        s[0] === prefix &&
        !!s[1] &&
        s[1] === prefix &&
        s[2] &&
        s[2] === prefix &&
        s[3] &&
        s[3] !== prefix
      );
    });

    // No symbols to get recommendations from, don't handle
    if (recSymbols.length <= 0) {
      return;
    }

    logger.log("Handle recommendation message", {
      command: currentCommand,
      recs: recSymbols,
    });

    // Use object to remove duplicate quote lookups
    const symbolMap: Record<string, boolean> = {};
    for (const symbol of recSymbols) {
      // Remove spaces
      let cleanSymbol = symbol.trim();

      // Remove PREFIX or double PREFIX
      while (cleanSymbol.startsWith(prefix)) {
        cleanSymbol = cleanSymbol.substring(1);
      }

      const stockSymbol = cleanSymbol.toUpperCase();
      symbolMap[stockSymbol] = true;
    }

    const symbolList = Object.keys(symbolMap);
    return lookupRecommendations(symbolList)
      .then((result) => messageHandlerOutput(result))
      .catch((e) => {
        logger.error(e, "Error getting recommendations");
        return messageHandlerError(e, {
          ERROR: `${e.code} ${e.message} ${e.response?.data}`,
        });
      });
  },
};
