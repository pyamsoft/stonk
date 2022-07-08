import { BotConfig } from "../config";

const NUMBER_REGEX = /\d/;

export interface SymbolCommand {
  isHelpCommand: boolean;
  symbols: string[];
}

export const symbolsToString = function (symbols: string[]): string {
  return symbols
    .map((s) => s.trim())
    .map((s) => s.toUpperCase())
    .join(",");
};

const stringContentToArray = function (
  config: BotConfig,
  sliceOut: number,
  content: string
): SymbolCommand {
  const { prefix } = config;
  // This is just the prefix
  if (content.split("").every((s) => s === prefix)) {
    return {
      isHelpCommand: true,
      symbols: [],
    };
  }

  // Here we separate our "command" name, and our "arguments" for the command.
  // e.g. if we have the message "+say Is this the real life?" , we'll get the following:
  // symbol = say
  // args = ["Is", "this", "the", "real", "life?"]
  const args = content.slice(sliceOut).trim().split(/\s+/g);
  const symbol = args.shift();

  // This is just plain ${prefix}, this is no longer a valid command
  if (symbol === prefix) {
    return {
      isHelpCommand: true,
      symbols: [],
    };
  }

  return {
    isHelpCommand: false,
    symbols: [...(symbol ? [symbol] : []), ...args],
  };
};

export const stringContentToSymbolList = function (
  config: BotConfig,
  content: string
): SymbolCommand {
  const { prefix } = config;

  // We escape here since it may be an escape character like $
  // noinspection RegExpRedundantEscape
  const regex = new RegExp(`\\${prefix}`, "g");

  const { isHelpCommand, symbols } = stringContentToArray(config, 0, content);

  const filteredSymbols = symbols
    .filter((s) => s.indexOf(prefix) >= 0 && s.length > 1)
    .filter((s) => {
      // Has options, split up first then check symbol
      if (s.indexOf(":") > 0) {
        const splitUp = s.split(":");
        if (splitUp.length <= 0) {
          return false;
        }

        // A symbol cannot be numbers
        const symbol = s.split(":")[0];
        return !NUMBER_REGEX.test(symbol);
      } else {
        return !NUMBER_REGEX.test(s);
      }
    })
    .map((s) => s.replace(regex, ""));

  return {
    isHelpCommand: isHelpCommand || filteredSymbols.length <= 0,
    symbols: filteredSymbols,
  };
};
