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
${p("SYMBOL[:OPTION] ...   Price information for <SYMBOL>")}
${lk("QUERY ...            Price information for <QUERY>")}

[OPTIONS]
watch[LOW|HIGH]        Watch the <SYMBOL> for if/when it crosses the <LOW> or <HIGH> points
stopwatch              Stop watching the <SYMBOL>

[EXAMPLE]

    An OPTION can be added to a COMMAND by appending it with ':'

${p("MSFT                  Gets price information for MSFT")}
${lk("Apple                Lookup the symbol for 'Apple' and get price information.")}
`);
};
