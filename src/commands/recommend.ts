import {MessageHandler, messageHandlerOutput} from "../bot/message/MessageHandler";
import { newLogger } from "../bot/logger";
import { BotConfig } from "../config";
import { SymbolCommand } from "./symbol";
import { KeyedObject } from "../bot/model/KeyedObject";

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

    const symbolList = Object.keys(symbolMap);
    logger.log("Find recs for: ", symbolList);
    return Promise.resolve(messageHandlerOutput({}));
  },
};
