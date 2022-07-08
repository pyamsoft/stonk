import {
  messageHandlerOutput,
  MessageHandlerOutput,
} from "../../bot/message/MessageHandler";
import { KeyedObject } from "../../bot/model/KeyedObject";
import { quoteApi } from "../../yahoo/quote";
import { outputQuote, outputQuoteError } from "../outputs/quote";

export const findQuotesForSymbols = function (
  symbols: string[]
): Promise<MessageHandlerOutput> {
  const resolved: KeyedObject<string> = {};
  return quoteApi(symbols).then((response) => {
    for (const res of response) {
      if (res.error) {
        resolved[res.symbol] = outputQuoteError(res.symbol, res.error);
      } else if (res.quote) {
        resolved[res.symbol] = outputQuote(res.quote);
      }
    }

    return messageHandlerOutput(resolved);
  });
};
