/*
 * Copyright 2024 pyamsoft
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { BotConfig } from "../../config";
import { Message, PartialMessage } from "discord.js";
import { KeyedMessageHandler, MessageHandlerOutput } from "./MessageHandler";
import { newLogger } from "../logger";
import { MessageCache } from "./MessageCache";
import {
  logMsg,
  Msg,
  msgFromMessage,
  SendChannel,
  sendChannelFromMessage,
} from "./Msg";
import { stringContentToSymbolList } from "../../commands/symbol";
import { MessageEventType } from "../model/MessageEventType";
import { validateMessage } from "./validate";
import {
  createCommunicationMessage,
  createCommunicationResult,
  sendMessage,
} from "./communicate";
import { KeyedObject } from "../model/KeyedObject";

const logger = newLogger("messages");

const sendMessageAfterParsing = function (
  results: MessageHandlerOutput[],
  message: Msg,
  sendChannel: SendChannel,
  env: {
    handlers: KeyedMessageHandler[];
    cache: MessageCache;
  },
) {
  // None of our handlers have done this, if we continue, behavior is undefined
  if (results.length <= 0) {
    logger.warn("No results, unhandled message: ", logMsg(message));
    return;
  }

  const combinedOutputs: KeyedObject<string> = {};
  for (const res of results) {
    // Any help outputs immediately stop the message sending
    if (!!res.helpOutput && !!res.helpOutput.trim()) {
      sendMessage(
        message.id,
        sendChannel,
        createCommunicationMessage(res.helpOutput),
        env,
      ).then((responded) => {
        logger.log("Responded with help text", !!responded);
      });
      return;
    } else {
      for (const key of Object.keys(res.messages)) {
        combinedOutputs[key] = res.messages[key];
      }
    }
  }

  // Otherwise we've collected all of our output, so spit it out into a single message
  sendMessage(
    message.id,
    sendChannel,
    createCommunicationResult(combinedOutputs),
    env,
  ).then((responded) => {
    logger.log(
      "Responded with combined output for keys: ",
      Object.keys(combinedOutputs),
      !!responded,
    );
  });
};

export const handleBotMessage = function (
  config: BotConfig,
  eventType: MessageEventType,
  message: Message | PartialMessage,
  optionalOldMessage: Message | PartialMessage | undefined,
  env: {
    handlers: KeyedMessageHandler[];
    cache: MessageCache;
  },
) {
  const msg = msgFromMessage(message);
  if (!validateMessage(config, msg)) {
    return;
  }

  const oldMsg = optionalOldMessage
    ? msgFromMessage(optionalOldMessage)
    : undefined;

  const sendChannel = sendChannelFromMessage(message);
  const current = stringContentToSymbolList(config, msg.content);
  const old = oldMsg
    ? stringContentToSymbolList(config, oldMsg.content)
    : undefined;

  if (current.ignore) {
    logger.log("Current command is ignored: ", {
      command: current,
      eventType,
      message,
    });
    return;
  }

  const work = [];
  const { handlers } = env;
  for (const item of handlers) {
    // If it was removed, skip it
    if (!item) {
      continue;
    }

    const { handler, id, type } = item;
    if (type === eventType) {
      const output = handler.handle(config, {
        currentCommand: current,
        oldCommand: old,
      });
      if (output) {
        logger.log("Pass message to handler: ", {
          id,
          type,
          name: handler.tag,
        });
        work.push(output);
      }
    }
  }

  Promise.all(work).then((results) =>
    sendMessageAfterParsing(results, msg, sendChannel, env),
  );
};
