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

import { BotConfig } from "./config";
import { QuoteHandler } from "./commands/quote";
import { newLogger } from "./bot/logger";

const logger = newLogger("HealthCheck");

const fireHealthCheck = function (
  config: BotConfig,
  urls: ReadonlyArray<string>,
  methods: ReadonlyArray<RequestInit["method"]>,
  bearerTokens: ReadonlyArray<string>,
) {
  // Check that AAPL returns some data.
  // If it does, we are live and working
  // If it does not, we are dead
  logger.log(`Attempt check AAPL`);
  Promise.resolve().then(async () => {
    const check = await QuoteHandler.handle(config, {
      currentCommand: {
        symbols: ["$AAPL"],
        isHelpCommand: false,
        ignore: false,
        ignoreReason: "",
      },
      oldCommand: undefined,
    });

    const success = !!(check && !check.error);

    const work: Promise<unknown>[] = [];
    for (let i = 0; i < urls.length; ++i) {
      const url = urls[i];
      const method = methods[i];
      const bearerToken = bearerTokens[i];

      let headers: RequestInit["headers"] | undefined = undefined;
      if (bearerToken) {
        headers = {
          Authorization: `Bearer ${bearerToken}`,
        };
      }

      work.push(
        Promise.resolve().then(async () => {
          try {
            await fetch(`${url}?success=${success}`, {
              // If undefined, will be axios default "get"
              method,
              headers,
            });
          } catch (e) {
            // Health check error, try again later
            // Maybe network is offline?
            logger.error(`Healthcheck report failed!`, url, success, e);
          }
        }),
      );
    }

    await Promise.all(work);
  });
};

export const registerPeriodicHealthCheck = function (config: BotConfig) {
  let timer: NodeJS.Timeout | undefined = undefined;

  const { healthCheckUrls, healthCheckMethods, healthCheckBearerTokens } =
    config;

  if (healthCheckUrls.length > 0) {
    timer = setInterval(() => {
      fireHealthCheck(
        config,
        healthCheckUrls,
        healthCheckMethods,
        healthCheckBearerTokens,
      );
    }, 60 * 1000);

    fireHealthCheck(
      config,
      healthCheckUrls,
      healthCheckMethods,
      healthCheckBearerTokens,
    );
  }

  return {
    unregister: function () {
      if (timer) {
        clearInterval(timer);
        timer = undefined;
      }
    },
  };
};
