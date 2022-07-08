import { BotConfig } from "../../config";
import { Message, PartialMessage } from "discord.js";
import { KeyedMessageHandler } from "./MessageHandler";
import { newLogger } from "../logger";
import { MessageCache } from "./MessageCache";
import { msgFromMessage } from "./Msg";

const logger = newLogger("messages");

export const handleBotMessage = function (
  eventType: "message" | "messageUpdate",
  message: Message | PartialMessage,
  optionalOldMessage: Message | PartialMessage | undefined,
  args: {
    config: BotConfig;
    handlers: KeyedMessageHandler[];
    cache: MessageCache;
  }
) {
  let handled = false;

  const msg = msgFromMessage(message);
  const oldMsg = optionalOldMessage
    ? msgFromMessage(optionalOldMessage)
    : undefined;

  const { handlers, config } = args;
  for (const item of handlers) {
    // If it was removed, skip it
    if (!item) {
      continue;
    }

    const { handler, id } = item;
    if (handler.event === eventType) {
      if (handler.handle(config, msg, oldMsg)) {
        logger.log("Message handled by handler: ", { eventType, id });
        handled = true;
        break;
      }
    }
  }

  if (!handled) {
    logger.warn("Message unhandled: ", {
      eventType,
      handlers,
      message,
      optionalOldMessage,
    });
  }
};
