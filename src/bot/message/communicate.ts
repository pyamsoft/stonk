import { MessageCache } from "./MessageCache";
import { newLogger } from "../logger";
import {
  DiscordMsg,
  editorFromMessage,
  MessageEditor,
  Msg,
  removerFromMessage,
  SendChannel,
} from "./Msg";
import { ensureArray } from "../../util/array";
import { KeyedObject } from "../model/KeyedObject";

const logger = newLogger("communicate");

export interface CommunicationResult<T> {
  objectType: "CommunicationResult";
  error: string;
  data: T | undefined;
}

export interface CommunicationMessage {
  objectType: "CommunicationMessage";
  message: string;
}

const deleteOldMessages = function (
  messageId: string,
  keys: string[],
  env: {
    cache: MessageCache;
  }
): Promise<void | void[]> {
  const { cache } = env;
  const allOldData = cache.getAll(messageId);
  const oldContents = Object.keys(allOldData);
  if (oldContents.length <= 0) {
    logger.log("No old contents to delete, continue.");
    return Promise.resolve();
  }

  const work = [];
  for (const key of oldContents) {
    // If the new message replacing this one does not include previous existing content, delete the old message
    // that holds the old content
    if (!keys.includes(key) && oldContents.includes(key)) {
      const oldMessage = allOldData[key];

      // Double check
      if (!oldMessage) {
        continue;
      }

      // We know this to be true
      const fullMessage = oldMessage as DiscordMsg;
      const remover = removerFromMessage(fullMessage.raw);
      const working = remover
        .remove()
        .then((id) => {
          logger.log("Deleted old message: ", {
            key,
            messageId: id,
          });
          cache.remove(messageId, key);
        })
        .catch((e) => {
          logger.error(e, "Failed to delete old message", {
            key,
            messageId: oldMessage.id,
          });
        });

      // Add to the list of jobs we are waiting for
      work.push(working);
    }
  }

  return Promise.all(work);
};

const postNewMessages = function (
  messageId: string,
  channel: SendChannel,
  keys: string[],
  messages: KeyedObject<string>,
  env: {
    cache: MessageCache;
  }
): Promise<Msg[]> {
  const work = [];
  for (const key of keys) {
    const messageText = messages[key];
    if (!!messageText && !!messageText.trim()) {
      const working = postMessageToPublicChannel(
        messageId,
        channel,
        messageText,
        {
          ...env,
          cacheKey: key,
          cacheResult: true,
        }
      );

      // Add to the list of jobs we are waiting for
      work.push(working);
    }
  }

  return Promise.all(work).then((results) => {
    const messagesOnly = [];
    for (const msg of results) {
      if (!!msg) {
        messagesOnly.push(msg);
      }
    }

    return messagesOnly;
  });
};

const editExistingMessage = function (
  editor: MessageEditor,
  oldMessage: Msg,
  messageText: string,
  env: {
    cacheKey: string;
    cache: MessageCache;
    cacheResult: boolean;
  }
): Promise<Msg | undefined> {
  const { cache, cacheKey, cacheResult } = env;
  return new Promise((resolve) => {
    editor
      .edit(messageText)
      .then((newMessage) => {
        logger.log("Updated old message with new content: ", {
          key: cacheKey,
          oldMessageId: oldMessage.id,
          newMessageId: newMessage.id,
        });
        if (cacheResult) {
          logger.log("Caching update result: ", {
            messageId: newMessage.id,
            key: cacheKey,
          });
          cache.insert(newMessage.id, cacheKey, newMessage);
          resolve(newMessage);
        }
      })
      .catch((e) => {
        logger.error(e, "Unable to update old message with new content: ", {
          key: cacheKey,
          oldMessageId: oldMessage.id,
        });
        resolve(undefined);
      });
  });
};

const sendNewMessageToChannel = function (
  channel: SendChannel,
  messageText: string,
  env: {
    cacheKey: string;
    cache: MessageCache;
    cacheResult: boolean;
  }
): Promise<Msg | undefined> {
  const { cache, cacheKey, cacheResult } = env;
  return new Promise((resolve) => {
    channel
      .send(messageText)
      .then((newMessage) => {
        logger.log("Send new message: ", {
          messageId: newMessage.id,
          key: cacheKey,
        });

        if (cacheResult) {
          logger.log("Caching new message result: ", {
            messageId: newMessage.id,
            key: cacheKey,
          });
          cache.insert(newMessage.id, cacheKey, newMessage);
        }
        resolve(newMessage);
      })
      .catch((e) => {
        logger.error(e, "Unable to send message", {
          key: cacheKey,
          text: messageText,
        });
        resolve(undefined);
      });
  });
};

const postMessageToPublicChannel = function (
  messageId: string,
  channel: SendChannel,
  messageText: string,
  env: {
    cacheKey: string;
    cache: MessageCache;
    cacheResult: boolean;
  }
): Promise<Msg | undefined> {
  const { cache, cacheKey } = env;
  const oldMessage =
    !!cacheKey && !!cacheKey.trim()
      ? cache.get(messageId, cacheKey)
      : undefined;

  if (oldMessage) {
    // We know this to be true
    const fullMessage = oldMessage as DiscordMsg;
    const editor = editorFromMessage(fullMessage.raw);
    return editExistingMessage(editor, oldMessage, messageText, env);
  } else {
    return sendNewMessageToChannel(channel, messageText, env);
  }
};

export const sendMessage = function (
  messageId: string,
  channel: SendChannel,
  content: CommunicationMessage | CommunicationResult<KeyedObject<string>>,
  env: {
    cache: MessageCache;
  }
): Promise<Msg[]> {
  if (content.objectType === "CommunicationMessage") {
    // Plain text message, never cached, just sent over plainly
    return postMessageToPublicChannel(messageId, channel, content.message, {
      ...env,
      cacheKey: "",
      cacheResult: false,
    }).then((msg) => {
      if (msg) {
        return ensureArray(msg);
      } else {
        return [];
      }
    });
  } else {
    const { error, data } = content;
    // If missing data, we assume error is not blank and thus, is an error
    // Don't cache error messages
    if (!data) {
      return postMessageToPublicChannel(messageId, channel, error, {
        ...env,
        cacheKey: "",
        cacheResult: false,
      }).then((msg) => {
        if (msg) {
          return ensureArray(msg);
        } else {
          return [];
        }
      });
    } else {
      // Delete any old messages first
      const keys = Object.keys(data);
      return deleteOldMessages(messageId, keys, env).then(() =>
        postNewMessages(messageId, channel, keys, data, env)
      );
    }
  }
};
