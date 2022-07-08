import { MessageHandler } from "./MessageHandler";
import { newLogger } from "../../../logger";
import { BotConfig } from "../../../config";
import { validateMessage } from "../validate";
import { Msg } from "../Msg";

const logger = newLogger("LookupHelpHandler");

export const LookupHelpHandler: MessageHandler = {
  event: "message",

  handle: function (config: BotConfig, message: Msg) {
    if (!validateMessage(config, message)) {
      logger.warn("Could not validate message: ", message);
      return false;
    }

    const { content } = message;
    if (content.trim() === `${config.prefix}${config.prefix}`) {
      logger.log("Handle lookup help message");
      return true;
    }

    return false;
  },
};
