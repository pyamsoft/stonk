import { Msg } from "./Msg";
import { BotConfig } from "../../config";
import { newLogger } from "../logger";

const logger = newLogger("MessageValidation");

export const validateMessageHasId = function (message: Msg): boolean {
  return !!message.id;
};

export const validateMessageIsNotFromBot = function (message: Msg): boolean {
  return !message.author.bot;
};

export const validateMessageHasChannel = function (message: Msg): boolean {
  return !!message.channel;
};

export const validateMessageIsTextChannel = function (message: Msg): boolean {
  // TODO(Peter): Support DM messages
  return message.channel.type === "GUILD_TEXT";
};

export const validateMessageIsSpecificChannel = function (
  config: BotConfig,
  message: Msg
): boolean {
  if (config.specificChannel) {
    return message.channel.id === config.specificChannel;
  } else {
    return true;
  }
};

export const validateMessageIsWatched = function (
  config: BotConfig,
  message: Msg
): boolean {
  return message.content.startsWith(config.prefix);
};

export const validateMessage = function (
  config: BotConfig,
  message: Msg
): boolean {
  if (!validateMessageHasId(message)) {
    logger.warn("Message is missing id", message);
    return false;
  }

  if (!validateMessageIsNotFromBot(message)) {
    logger.warn("Message is from bot user", message);
    return false;
  }

  if (!validateMessageHasChannel(message)) {
    logger.warn("Message is missing channel", message);
    return false;
  }

  if (!validateMessageIsTextChannel(message)) {
    logger.warn("Message is not public text channel", message);
    return false;
  }

  if (!validateMessageIsSpecificChannel(config, message)) {
    logger.warn(
      "Message is not on specific channel",
      config.specificChannel,
      message
    );
    return false;
  }

  if (!validateMessageIsWatched(config, message)) {
    logger.warn("Message is watched content", config.prefix, message);
    return false;
  }

  // Looks good
  return true;
};
