import { MessageHandler } from "./MessageHandler";
import { newLogger } from "../../../logger";
import { BotConfig } from "../../../config";
import { validateMessage } from "../validate";
import { Msg } from "../Msg";

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
