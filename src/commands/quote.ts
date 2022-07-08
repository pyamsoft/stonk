import { MessageHandler } from "../bot/message/MessageHandler";
import { newLogger } from "../bot/logger";
import { BotConfig } from "../config";
import { SendChannel } from "../bot/message/Msg";
import { MessageCache } from "../bot/message/MessageCache";
import { SymbolCommand } from "./symbol";

const TAG = "QuoteHandler";
const logger = newLogger(TAG);

export const QuoteHandler: MessageHandler = {
  tag: TAG,

  handle: function (
    _config: BotConfig,
    _sendChannel: SendChannel,
    _messages: {
      currentMessageId: string;
      oldMessageId?: string;
    },
    command: {
      currentCommand: SymbolCommand;
      oldCommand?: SymbolCommand;
    },
    _env: {
      cache: MessageCache;
    }
  ) {
    // Do not handle help
    const { currentCommand } = command;
    if (currentCommand.isHelpCommand) {
      return;
    }

    logger.log("Handle quote message", currentCommand);
    return;
  },
};
