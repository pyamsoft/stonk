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

import axios from "axios";
import { BotConfig } from "./config";
import { QuoteHandler } from "./commands/quote";

const fireHealthCheck = function (config: BotConfig, url: string) {
  // Check that AAPL returns some data.
  // If it does, we are live and working
  // If it does not, we are dead
  Promise.resolve().then(async () => {
    const check = await QuoteHandler.handle(config, {
      currentCommand: {
        symbols: ["$AAPL"],
        isHelpCommand: false,
      },
      oldCommand: undefined,
    });

    try {
      if (check && !check.error) {
        await axios({
          method: "GET",
          url: `${url}?status=up&msg=OK&ping=`,
        });
      } else {
        await axios({
          method: "GET",
          url: `${url}?status=down&msg=${encodeURIComponent("Failed to get health quote for AAPL")}&ping=`,
        });
      }
    } catch (_e) {
      // Health check error, try again later
      // Maybe network is offline?
    }
  });
};

export const registerPeriodicHealthCheck = function (config: BotConfig) {
  let timer: NodeJS.Timeout | undefined = undefined;

  const { healthCheckUrl } = config;

  if (healthCheckUrl) {
    timer = setInterval(() => {
      fireHealthCheck(config, healthCheckUrl);
    }, 60 * 1000);

    fireHealthCheck(config, healthCheckUrl);
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
