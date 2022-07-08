import { MessageHandler } from "../bot/message/MessageHandler";
import { newLogger } from "../bot/logger";
import { BotConfig } from "../config";
import { SendChannel } from "../bot/message/Msg";
import { outputHelpText } from "./outputs/help";
import {
  createCommunicationMessage,
  sendMessage,
} from "../bot/message/communicate";
import { MessageCache } from "../bot/message/MessageCache";
import { SymbolCommand } from "./symbol";

const TAG = "HelpHandler";
const logger = newLogger(TAG);

export const HelpHandler: MessageHandler = {
  tag: TAG,

  handle: function (
    config: BotConfig,
    sendChannel: SendChannel,
    messages: {
      currentMessageId: string;
      oldMessageId?: string;
    },
    command: {
      currentCommand: SymbolCommand;
      oldCommand?: SymbolCommand;
    },
    env: {
      cache: MessageCache;
    }
  ) {
    // Only handle help
    const { currentCommand } = command;
    if (!currentCommand.isHelpCommand) {
      return;
    }

    logger.log("Handle help message", currentCommand);
    const { currentMessageId } = messages;
    sendMessage(
      currentMessageId,
      sendChannel,
      createCommunicationMessage(outputHelpText(config)),
      env
    ).then(() => {
      logger.log("Responded with help text");
    });
    return;
  },
};
