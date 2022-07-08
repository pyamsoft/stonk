import { BotConfig } from "../../config";
import { Msg } from "./Msg";

export interface KeyedMessageHandler {
  id: string;
  handler: MessageHandler;
}

export interface MessageHandler {
  event: "message" | "messageUpdate";

  tag: string;

  handle: (
    config: BotConfig,
    message: Msg,
    optionalOldMessage?: Msg
  ) => boolean;
}
