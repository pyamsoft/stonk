import { BotConfig } from "../config";
import { Client, Intents, Message, PartialMessage } from "discord.js";
import { newLogger } from "../logger";
import { MessageHandler } from "./message/handler/MessageHandler";
import { KeyedObject } from "../model/KeyedObject";
import { generateRandomId } from "../model/id";
import { Listener, newListener } from "../model/listener";

const logger = newLogger("DiscordBot");

export interface DiscordBot {
  login: () => Promise<boolean>;

  addHandler: (handler: MessageHandler) => string;

  removeHandler: (id: string) => boolean;

  watchMessages: () => Listener;
}

interface KeyedMessageHandler {
  id: string;
  handler: MessageHandler;
}

export const initializeBot = function (config: BotConfig): DiscordBot {
  const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.DIRECT_MESSAGES],
  });

  const handlers: KeyedObject<KeyedMessageHandler | undefined> = {};
  let handlerList: KeyedMessageHandler[] = [];

  const handleMessage = function (
    eventType: "message" | "messageUpdate",
    message: Message | PartialMessage,
    optionalOldMessage: Message | PartialMessage | undefined
  ) {
    let handled = false;
    for (const item of handlerList) {
      // If it was removed, skip it
      if (!item) {
        continue;
      }

      const { handler, id } = item;
      if (handler.event === eventType) {
        if (handler.handle(message, optionalOldMessage)) {
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
      });
    }
  };

  const messageHandler = function (message: Message) {
    logger.log("Message received", message);
    handleMessage("message", message, undefined);
  };

  const messageUpdateHandler = function (
    oldMessage: Message | PartialMessage,
    newMessage: Message | PartialMessage
  ) {
    logger.log("Message updated", {
      old: oldMessage,
      new: newMessage,
    });
    handleMessage("messageUpdate", newMessage, oldMessage);
  };

  return Object.freeze({
    addHandler: function (handler: MessageHandler) {
      const id = generateRandomId();
      handlers[id] = { id, handler };
      handlerList = Object.values(handlers).filter(
        (h) => !!h
      ) as KeyedMessageHandler[];
      return id;
    },
    removeHandler: function (id: string) {
      if (handlers[id]) {
        handlers[id] = undefined;
        handlerList = Object.values(handlers).filter(
          (h) => !!h
        ) as KeyedMessageHandler[];
        return true;
      } else {
        return false;
      }
    },
    watchMessages: function () {
      client.on("message", messageHandler);
      client.on("messageUpdate", messageUpdateHandler);
      return newListener(() => {
        client.off("message", messageHandler);
        client.off("messageUpdate", messageUpdateHandler);
      });
    },
    login: async function () {
      const { token } = config;
      try {
        const result = await client.login(token);
        logger.log("Bot logged in!", result);
        return true;
      } catch (e) {
        logger.error(e, "Error logging in");
        return false;
      }
    },
  });
};
