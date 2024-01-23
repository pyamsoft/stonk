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

import { KeyedObject } from "../../bot/model/KeyedObject";
import { quoteApi } from "../../yahoo/quote";
import { outputQuote } from "../outputs/quote";

export const findQuotesForSymbols = async function (
  symbols: string[],
): Promise<KeyedObject<string>> {
  const resolved: KeyedObject<string> = {};
  if (symbols.length <= 0) {
    return resolved;
  }

  return quoteApi(symbols).then((response) => {
    for (const res of response) {
      if (res.error) {
        resolved[res.symbol] = res.error;
      } else if (res.quote) {
        resolved[res.symbol] = outputQuote(res.quote);
      }
    }

    return resolved;
  });
};
