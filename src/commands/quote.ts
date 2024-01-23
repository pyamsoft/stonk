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
  messageHandlerError,
  messageHandlerOutput,
} from "../bot/message/MessageHandler";
import { newLogger } from "../bot/logger";
import { BotConfig } from "../config";
import { SymbolCommand } from "./symbol";
import { findQuotesForSymbols } from "./work/quote";
import { AxiosError } from "axios";
import { lookupRecommendations } from "./work/recommend";
import { KeyedObject } from "../bot/model/KeyedObject";

const TAG = "QuoteHandler";
const logger = newLogger(TAG);

type ExtendedSymbols = {
  recs: string[];
};

const parseExtendedSymbols = function (
  quoteSymbols: string[],
): ExtendedSymbols {
  const recs = new Set<string>();
  for (const symbol of quoteSymbols) {
    const indexOfOptionsStart = symbol.indexOf(":");

    // Ignore "plain" symbols
    if (indexOfOptionsStart <= -1) {
      continue;
    }

    const justSymbol = symbol.substring(0, indexOfOptionsStart);
    const options = symbol.substring(indexOfOptionsStart + 1).split(",");
    logger.log("REC: ", justSymbol, options, symbol);
    if (options.includes("REC")) {
      recs.add(justSymbol.trim());
    }
  }

  return {
    recs: [...recs],
  };
};

export const QuoteHandler: MessageHandler = {
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

    const quoteSymbols = symbols
      .filter((s) => {
        // Quote lookups start with the prefix only once, a double prefix is a lookup
        return s[0] === prefix && !!s[1] && s[1] !== prefix;
      })
      // Remove spaces
      .map((s) => s.trim())
      // Uppercase
      .map((s) => s.toUpperCase())
      // Remove PREFIX
      .map((s) => {
        let cleanSymbol = s;
        while (cleanSymbol.startsWith(prefix)) {
          cleanSymbol = cleanSymbol.substring(1);
        }
        return cleanSymbol;
      });

    // No quotes, don't handle
    if (quoteSymbols.length <= 0) {
      return;
    }

    // "Plain" symbols like $MSFT or $AAPL are handled here, but the presence of ":" means the
    // symbol is running in an extended option mode.
    //
    // Thus, it should be handled by an Extended handler
    //
    // Process as a set to de-dupe
    const plainSymbols = new Set(quoteSymbols.filter((s) => !s.includes(":")));
    const extendedSymbols = parseExtendedSymbols(quoteSymbols);

    logger.log("Handle quote message", {
      command: currentCommand,
      rawSymbols: quoteSymbols,
      plainSymbols,
      extendedSymbols,
    });

    // Promise.all as we prepare for the future when we can handle multiple lookup types all at once
    return Promise.all([
      findQuotesForSymbols([...plainSymbols]),
      lookupRecommendations(extendedSymbols.recs),
    ])
      .then(([quoteResults, recResults]) => {
        const combinedResults = {
          // Recommendations first
          ...recResults,
          // Override with direct requests
          ...quoteResults,
        };

        // Order by input order when possible
        const used = new Set<string>();
        const allResults: KeyedObject<string> = {};

        // Once to use everything in order
        for (const symbol of quoteSymbols) {
          const result = combinedResults[symbol];
          if (result) {
            allResults[symbol] = result;
            used.add(symbol);
          }
        }

        // Again to add any "unused"
        for (const symbol of Object.keys(combinedResults)) {
          if (!used.has(symbol)) {
            const result = combinedResults[symbol];
            if (result) {
              allResults[symbol] = result;
            }
          }
        }

        return messageHandlerOutput(allResults);
      })
      .catch((e: AxiosError) => {
        logger.error(e, "Error getting quotes");
        return messageHandlerError(e, {
          ERROR: `${e.code} ${e.message} ${e.response?.data}`,
        });
      });
  },
};
