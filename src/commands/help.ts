import { MessageHandler } from "../bot/message/MessageHandler";
import { newLogger } from "../bot/logger";
import { BotConfig } from "../config";
import { validateMessage } from "../bot/message/validate";
import { Msg } from "../bot/message/Msg";

const TAG = "HelpHandler"
const logger = newLogger(TAG);

export const HelpHandler: MessageHandler = {
  event: "message",

  tag: TAG,

  handle: function (config: BotConfig, message: Msg) {
    if (!validateMessage(config, message)) {
      logger.warn("Could not validate message: ", message);
      return false;
    }

    const { content } = message;
    if (content.trim() === config.prefix) {
      logger.log("Handle help message");
      return true;
    }

    return false;
  },
};
