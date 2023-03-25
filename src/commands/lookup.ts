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
import { findQuotesForSymbols } from "./work/quote";
import { lookupApi } from "../yahoo/lookup";
import { KeyedObject } from "../bot/model/KeyedObject";

const TAG = "LookupHandler";
const logger = newLogger(TAG);

export const LookupHandler: MessageHandler = {
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

    const lookupQueries = symbols.filter((s) => {
      // Quote lookups have a double prefix
      return (
        s[0] === prefix && !!s[1] && s[1] === prefix && s[2] && s[2] !== prefix
      );
    });

    // No queries, don't handle
    if (lookupQueries.length <= 0) {
      return;
    }

    logger.log("Handle lookup message", {
      command: currentCommand,
      queries: lookupQueries,
    });

    const queryMap: KeyedObject<boolean> = {};
    for (const query of lookupQueries) {
      let cleanQuery = query.trim();
      while (cleanQuery.startsWith(prefix)) {
        cleanQuery = cleanQuery.substring(1);
      }
      queryMap[cleanQuery] = true;
    }

    const queryList = Object.keys(queryMap).map((q) => lookupApi(q));
    return Promise.all(queryList).then((results) => {
      const errors: KeyedObject<string> = {};
      const symbols = [];
      for (const res of results) {
        if (!!res.symbol && !!res.symbol.trim()) {
          symbols.push(res.symbol.toUpperCase());
        } else if (res.error) {
          errors[res.query] = res.error;
        } else {
          errors[res.query] = `Unable to lookup ticker: ${res.query}`;
        }
      }

      // No symbols found, only errors
      if (symbols.length <= 0) {
        return messageHandlerOutput(errors);
      }

      return findQuotesForSymbols(symbols).then((quotes) => {
        for (const key of Object.keys(errors)) {
          quotes[key] = errors[key];
        }

        return messageHandlerOutput(quotes);
      });
    });
  },
};
