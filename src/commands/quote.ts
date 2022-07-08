import {
  MessageHandler,
  messageHandlerOutput,
} from "../bot/message/MessageHandler";
import { newLogger } from "../bot/logger";
import { BotConfig } from "../config";
import { SymbolCommand } from "./symbol";
import { findQuotesForSymbols } from "./work/quote";

const TAG = "QuoteHandler";
const logger = newLogger(TAG);

export const QuoteHandler: MessageHandler = {
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

    const quoteSymbols = symbols.filter((s) => {
      // Quote lookups start with the prefix only once, a double prefix is a lookup
      return s[0] === prefix && !!s[1] && s[1] !== prefix;
    });

    // No quotes, don't handle
    if (quoteSymbols.length <= 0) {
      return;
    }

    logger.log("Handle quote message", currentCommand);
    const symbolList = [];
    for (const symbol of quoteSymbols) {
      let cleanSymbol = symbol.trim();
      while (cleanSymbol.startsWith(prefix)) {
        cleanSymbol = cleanSymbol.substring(1);
      }
      const stockSymbol = cleanSymbol.toUpperCase();
      symbolList.push(stockSymbol);
    }

    return findQuotesForSymbols(symbolList).then((result) =>
      messageHandlerOutput(result)
    );
  },
};
