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

import {
  MessageHandler,
  messageHandlerOutput,
} from "../bot/message/MessageHandler";
import { newLogger } from "../bot/logger";
import { BotConfig } from "../config";
import { SymbolCommand } from "./symbol";
import { KeyedObject } from "../bot/model/KeyedObject";
import { recommendApi } from "../yahoo/recommend";
import { findQuotesForSymbols } from "./work/quote";
import { bold } from "../bot/discord/format";

const TAG = "RecommendHandler";
const logger = newLogger(TAG);

export const RecommendHandler: MessageHandler = {
  tag: TAG,

  handle: function (
    config: BotConfig,
    command: {
      currentCommand: SymbolCommand;
      oldCommand?: SymbolCommand;
    }
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
    const symbolMap: KeyedObject<boolean> = {};
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

    const recList = Object.keys(symbolMap).map((s) => recommendApi(s));
    return Promise.all(recList).then((results) => {
      const errors: KeyedObject<string> = {};
      const symbolResolvers = [];
      for (const res of results) {
        if (res.recommendations.length > 0) {
          symbolResolvers.push(
            findQuotesForSymbols(res.recommendations).then((results) => {
              // Pair the recs with the symbol
              return {
                symbol: res.symbol,
                recs: results,
              };
            })
          );
        } else if (res.error) {
          errors[res.symbol] = res.error;
        } else {
          errors[res.symbol] = `Unable to get recommendation: ${res.symbol}`;
        }
      }

      // No symbols found, only errors
      if (symbolResolvers.length <= 0) {
        return messageHandlerOutput(errors);
      }

      return Promise.all(symbolResolvers).then((results) => {
        const quotes: KeyedObject<string> = {};

        // For lookup
        for (const pairing of results) {
          // The symbol found these recs
          const { symbol, recs } = pairing;
          for (const recSymbol of Object.keys(recs)) {
            // For rec symbol, attach OG, like MSFT found rec AAPL
            const outputText = recs[recSymbol];
            const messageSymbol = `${bold(
              symbol
            )} recommends similar ticker =>`;
            quotes[recSymbol] = `${messageSymbol}${outputText}`;
          }
        }

        // Then, for any lookup errors, replace the text with the error text
        for (const key of Object.keys(errors)) {
          quotes[key] = errors[key];
        }

        return messageHandlerOutput(quotes);
      });
    });
  },
};
