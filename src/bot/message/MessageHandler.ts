import { BotConfig } from "../../config";
import { SendChannel } from "./Msg";
import { MessageCache } from "./MessageCache";
import { SymbolCommand } from "../../commands/symbol";

export interface KeyedMessageHandler {
  id: string;
  type: "messageCreate" | "messageUpdate";
  handler: MessageHandler;
}

export interface MessageHandler {
  tag: string;

  handle: (
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
  ) => void;
}
