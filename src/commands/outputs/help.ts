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

  return codeBlock(`
Beep Boop.

[COMMANDS]
${p("                      This help")}
${lk("                     This help")}
${p("SYMBOL...             Price information for <SYMBOL>")}
${lk("QUERY...             Price information for <QUERY>")}

[EXAMPLE]

${p("MSFT                  Gets price information for MSFT")}
${lk(
  "Apple                Lookup the symbol for 'Apple' and get price information."
)}
`);
};
