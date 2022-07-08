import { BotConfig } from "../config";
import { Channel, Message, PartialMessage, User } from "discord.js";
import { Msg } from "./message/Msg";
import { KeyedMessageHandler } from "./message/MessageHandler";
import { newLogger } from "../logger";

const logger = newLogger("messages");

const mapToMsg = function (message: Message | PartialMessage): Msg {
  return {
    id: message.id,
    author: message.author as User,
    channel: message.channel as Channel,
    content: message.content as string,
  };
};

export const handleBotMessage = function (
  eventType: "message" | "messageUpdate",
  config: BotConfig,
  message: Message | PartialMessage,
  optionalOldMessage: Message | PartialMessage | undefined,
  handlers: KeyedMessageHandler[]
) {
  let handled = false;

  const msg = mapToMsg(message);
  const oldMsg = optionalOldMessage ? mapToMsg(optionalOldMessage) : undefined;

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
