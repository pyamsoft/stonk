import {
  MessageHandler,
  messageHandlerOutput,
} from "../bot/message/MessageHandler";
import { newLogger } from "../bot/logger";
import { BotConfig } from "../config";
import { SymbolCommand } from "./symbol";
import { KeyedObject } from "../bot/model/KeyedObject";
import { quoteApi } from "../yahoo/quote";
import { outputQuote, outputQuoteError } from "./outputs/quote";

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

    logger.log("Handle quote message", currentCommand);
    const { prefix } = config;
    const { symbols } = currentCommand;
    const quoteSymbols = symbols.filter((s) => {
      // Quote lookups start with the prefix only once, a double prefix is a lookup
      return s[0] === prefix && !!s[1] && s[1] !== prefix;
    });

    const symbolList = [];
    const resolved: KeyedObject<string> = {};
    for (const symbol of quoteSymbols) {
      let cleanSymbol = symbol.trim();
      while (cleanSymbol.startsWith(prefix)) {
        cleanSymbol = cleanSymbol.substring(1);
      }
      const stockSymbol = cleanSymbol.toUpperCase();
      symbolList.push(stockSymbol);
    }

    return quoteApi(symbolList).then((response) => {
      for (const res of response) {
        if (res.error) {
          resolved[res.symbol] = outputQuoteError(res.symbol, res.error);
        } else if (res.quote) {
          resolved[res.symbol] = outputQuote(res.quote);
        }
      }

      return messageHandlerOutput(resolved);
    });
  },
};
