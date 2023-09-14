/*
 * Copyright 2023 pyamsoft
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
import { SymbolCommand } from "../../commands/symbol";
import { KeyedObject } from "../model/KeyedObject";

export interface KeyedMessageHandler {
  id: string;
  type: "messageCreate" | "messageUpdate";
  handler: MessageHandler;
}

export interface MessageHandlerOutput {
  objectType: "MessageHandlerOutput";
  helpOutput: string;
  messages: KeyedObject<string>;
  error: Error | undefined;
}

export const messageHandlerOutput = function (
  messages: KeyedObject<string>,
): MessageHandlerOutput {
  return {
    objectType: "MessageHandlerOutput",
    helpOutput: "",
    error: undefined,
    messages,
  };
};

export const messageHandlerError = function (
  error: Error,
  messages: KeyedObject<string>,
): MessageHandlerOutput {
  return {
    objectType: "MessageHandlerOutput",
    helpOutput: "",
    messages,
    error,
  };
};

export const messageHandlerHelpText = function (
  message: string,
): MessageHandlerOutput {
  return {
    objectType: "MessageHandlerOutput",
    helpOutput: message,
    error: undefined,
    messages: {},
  };
};

export interface MessageHandler {
  tag: string;

  handle: (
    config: BotConfig,
    command: {
      currentCommand: SymbolCommand;
      oldCommand?: SymbolCommand;
    },
  ) => Promise<MessageHandlerOutput> | undefined;
}
