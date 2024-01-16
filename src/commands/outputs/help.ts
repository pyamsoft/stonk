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
import { codeBlock } from "../../bot/discord/format";

export const outputHelpText = function (config: BotConfig): string {
  const { prefix } = config;

  const p = function (text: string): string {
    return `${prefix}${text}`;
  };

  const lk = function (text: string): string {
    return `${prefix}${prefix}${text}`;
  };

  const rec = function (text: string): string {
    return `${prefix}${prefix}${prefix}${text}`;
  };

  return codeBlock(`
Beep Boop.

[COMMANDS]
${p("                       This help")}
${lk("                      This help")}
${rec("                     This help")}
${p("SYMBOL...              Price quote for <SYMBOL>")}
${lk("QUERY...              Price quote for <QUERY>")}
${p("SYMBOL:rec...          Quotes for similar stocks for <SYMBOL>")}

[deprecated commands]
${rec("SYMBOL...            Quotes for similar stocks for <SYMBOL>")}

[EXAMPLE]

${p("MSFT                   Gets price quote for MSFT")}
${p(`MSFT ${p("AAPL")}             Gets price quote for MSFT and AAPL`)}

${lk("Apple                 Lookup symbol for 'Apple' and get price quote.")}
${lk(
  `Apple ${lk("Microsoft")}     Lookup symbol for 'Apple' and 'Microsoft' and
                        get respective price quote.`,
)}

${rec("AMD                  Get recommended stocks similar to 'AMD'")}
${p("AMD:rec                Get recommended stocks similar to 'AMD'")}
`);
};
