import { BotConfig } from "../config";
import { Client, Intents, Message, PartialMessage } from "discord.js";
import { newLogger } from "../logger";
import {
  KeyedMessageHandler,
  MessageHandler,
} from "./message/handler/MessageHandler";
import { KeyedObject } from "../model/KeyedObject";
import { generateRandomId } from "../model/id";
import { Listener, newListener } from "../model/listener";
import { handleBotMessage } from "./messages";

const logger = newLogger("DiscordBot");

export interface DiscordBot {
  login: () => Promise<boolean>;

  addHandler: (handler: MessageHandler) => string;

  removeHandler: (id: string) => boolean;

  watchMessages: () => Listener;
}

export const initializeBot = function (config: BotConfig): DiscordBot {
  const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.DIRECT_MESSAGES],
  });

  const handlers: KeyedObject<KeyedMessageHandler | undefined> = {};

  // Keep this cached to avoid having to recalculate it each time
  let handlerList: KeyedMessageHandler[] = [];

  const messageHandler = function (message: Message) {
    logger.log("Message received", message);
    handleBotMessage("message", config, message, undefined, handlerList);
  };

  const messageUpdateHandler = function (
    oldMessage: Message | PartialMessage,
    newMessage: Message | PartialMessage
  ) {
    logger.log("Message updated", {
      old: oldMessage,
      new: newMessage,
    });
    handleBotMessage(
      "messageUpdate",
      config,
      newMessage,
      oldMessage,
      handlerList
    );
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
      const readyListener = (user: Client) => {
        logger.log("Bot is ready!", user);
        client.on("message", messageHandler);
        client.on("messageUpdate", messageUpdateHandler);
      };

      client.once("ready", readyListener);
      return newListener(() => {
        client.off("ready", readyListener);
        client.off("message", messageHandler);
        client.off("messageUpdate", messageUpdateHandler);
      });
    },
    login: function () {
      const { token } = config;
      return client
        .login(token)
        .then((result) => {
          logger.log("Bot logged in!", result);
          return true;
        })
        .catch((e) => {
          logger.error(e, "Error logging in");
          return false;
        });
    },
  });
};
