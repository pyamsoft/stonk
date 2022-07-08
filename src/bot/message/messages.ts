import { BotConfig } from "../../config";
import { Message, PartialMessage } from "discord.js";
import { KeyedMessageHandler } from "./MessageHandler";
import { newLogger } from "../logger";
import { MessageCache } from "./MessageCache";
import { msgFromMessage, sendChannelFromMessage } from "./Msg";
import { stringContentToSymbolList } from "../../commands/symbol";
import { MessageEventType } from "../model/MessageEventType";
import { validateMessage } from "./validate";

const logger = newLogger("messages");

export const handleBotMessage = function (
  config: BotConfig,
  eventType: MessageEventType,
  message: Message | PartialMessage,
  optionalOldMessage: Message | PartialMessage | undefined,
  env: {
    handlers: KeyedMessageHandler[];
    cache: MessageCache;
  }
) {
  const msg = msgFromMessage(message);
  const oldMsg = optionalOldMessage
    ? msgFromMessage(optionalOldMessage)
    : undefined;

  if (!validateMessage(config, msg)) {
    return;
  }

  const { handlers } = env;
  for (const item of handlers) {
    // If it was removed, skip it
    if (!item) {
      continue;
    }

    const { cache } = env;
    const { handler, id, type } = item;
    if (type === eventType) {
      logger.log("Pass message to handler: ", id);
      const sendChannel = sendChannelFromMessage(message);
      const current = stringContentToSymbolList(config, msg.content);
      const old = oldMsg
        ? stringContentToSymbolList(config, oldMsg.content)
        : undefined;
      handler.handle(
        config,
        sendChannel,
        {
          currentMessageId: msg.id,
          oldMessageId: oldMsg ? oldMsg.id : undefined,
        },
        { currentCommand: current, oldCommand: old },
        {
          cache,
        }
      );
    }
  }
};
