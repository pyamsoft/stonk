import { BotConfig } from "../../config";
import { codeBlock } from "../../bot/discord/format";

export const outputHelpText = function (config: BotConfig): string {
  const { prefix } = config;
  return codeBlock(`
Beep Boop.

[COMMANDS]
${prefix}                         This help.
${prefix}${prefix}                        This help.
${prefix}SYMBOL:[OPTION    Price information for <SYMBOL>
${prefix}${prefix}QUERY:[OPTION...]       Query results for <QUERY>

[OPTIONS]
watch[LOW|HIGH]           Watch the <SYMBOL> for if/when it crosses the <LOW> or <HIGH> points
stopwatch                 Stop watching the <SYMBOL>

An OPTION can be added to a COMMAND by appending it with ':'

[EXAMPLE]
${prefix}MSFT                     Gets price information for MSFT
${prefix}${prefix}Microsoft Corporation   Reverse lookup a symbol for 'Microsoft Corporation' and gets price information.
`);
};
