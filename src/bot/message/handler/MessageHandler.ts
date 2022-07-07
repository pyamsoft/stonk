import { Message, PartialMessage } from "discord.js";

export interface MessageHandler {
  event: "message" | "messageUpdate";

  handle: (
    message: Message | PartialMessage,
    optionalOldMessage: Message | PartialMessage | undefined
  ) => boolean;
}
