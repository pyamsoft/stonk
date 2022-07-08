import { BotConfig } from "../config";
import { Client, Intents, Message, PartialMessage } from "discord.js";
import { newLogger } from "./logger";
import { KeyedMessageHandler, MessageHandler } from "./message/MessageHandler";
import { KeyedObject } from "./model/KeyedObject";
import { generateRandomId } from "./model/id";
import { Listener, newListener } from "./model/listener";
import { handleBotMessage } from "./message/messages";
import { createMessageCache } from "./message/MessageCache";

const logger = newLogger("DiscordBot");

export interface DiscordBot {
  login: () => Promise<boolean>;

  addHandler: (handler: MessageHandler) => string;

  removeHandler: (id: string) => boolean;

  watchMessages: (onStop: () => void) => Listener;
}

export const initializeBot = function (config: BotConfig): DiscordBot {
  const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.DIRECT_MESSAGES],
  });

  const handlers: KeyedObject<KeyedMessageHandler | undefined> = {};
  const messageCache = createMessageCache();

  // Keep this cached to avoid having to recalculate it each time
  let handlerList: KeyedMessageHandler[] = [];

  const messageHandler = function (message: Message | PartialMessage) {
    logger.log("Message received", message);
    handleBotMessage("message", message, undefined, {
      config,
      handlers: handlerList,
      cache: messageCache,
    });
  };

  const messageUpdateHandler = function (
    oldMessage: Message | PartialMessage,
    newMessage: Message | PartialMessage
  ) {
    logger.log("Message updated", {
      old: oldMessage,
      new: newMessage,
    });
    handleBotMessage("messageUpdate", newMessage, oldMessage, {
      config,
      handlers: handlerList,
      cache: messageCache,
    });
  };

  const objectValues = function <T>(o: object): T[] {
    const keys = Object.keys(o);
    const values: T[] = [];
    for (const key of keys) {
      values.push((o as any)[key] as T);
    }
    return values;
  };

  return Object.freeze({
    addHandler: function (handler: MessageHandler) {
      const id = generateRandomId();
      handlers[id] = { id, handler };
      logger.log("Add new handler: ", handlers[id]);
      handlerList = objectValues(handlers).filter(
        (h) => !!h
      ) as KeyedMessageHandler[];
      return id;
    },
    removeHandler: function (id: string) {
      if (handlers[id]) {
        logger.log("Removed handler: ", handlers[id]);
        handlers[id] = undefined;
        handlerList = objectValues(handlers).filter(
          (h) => !!h
        ) as KeyedMessageHandler[];
        return true;
      } else {
        return false;
      }
    },
    watchMessages: function (onStop: () => void) {
      const readyListener = () => {
        logger.log("Bot is ready!");
        logger.log("Watch for messages");
        client.on("message", messageHandler);
        client.on("messageUpdate", messageUpdateHandler);
      };

      logger.log("Wait until bot is ready");
      client.once("ready", readyListener);
      return newListener(() => {
        logger.log("Stop watching for messages");
        client.off("ready", readyListener);
        client.off("message", messageHandler);
        client.off("messageUpdate", messageUpdateHandler);
        onStop();
      });
    },
    login: function () {
      const { token } = config;
      return client
        .login(token)
        .then(() => {
          logger.log("Bot logged in!");
          return true;
        })
        .catch((e) => {
          logger.error(e, "Error logging in");
          return false;
        });
    },
  });
};
