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

import { newLogger } from "./bot/logger";
import env from "dotenv";
import { Method } from "axios";

const logger = newLogger("BotConfig");

export interface BotConfig {
  // Respond to chat prefix
  prefix: string;

  // API token
  token: string;

  // Only message these channel(s)
  targetedChannels: ReadonlyArray<string>;

  // Health check
  healthCheckUrls: ReadonlyArray<string>;
  healthCheckMethods: ReadonlyArray<Method>;
  healthCheckBearerTokens: ReadonlyArray<string>;
}

export const sourceConfig = function (): BotConfig {
  env.config();
  const rawSpecificChannel = process.env.BOT_TARGET_CHANNEL_IDS || "";
  const rawHealthcheckUrl = process.env.BOT_HEALTHCHECK_URLS || "";
  const rawHealthcheckMethod = process.env.BOT_HEALTHCHECK_METHODS || "";
  const rawHealthcheckBearerToken =
    process.env.BOT_HEALTHCHECK_BEARER_TOKENS || "";
  const config: BotConfig = Object.freeze({
    prefix: process.env.BOT_PREFIX || "$",

    token: process.env.BOT_TOKEN || "",

    targetedChannels: rawSpecificChannel
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s),

    healthCheckUrls: rawHealthcheckUrl
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s),
    healthCheckMethods: rawHealthcheckMethod
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s)
      .map((s) => s as Method),
    healthCheckBearerTokens: rawHealthcheckBearerToken
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s),
  });
  logger.log("Bot Config: ", config);
  return config;
};
