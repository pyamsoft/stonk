const OptionChain = require("./optionchain");
const Command = require("./command");
const Help = require("./help");
const Logger = require("../../logger");
const { asArray } = require("../../util/array");
const { symbolsToString } = require("../../util/symbol");
const YFinance = require("../source/yahoo");

const logger = Logger.tag("bot/command/lookup");

function lookupSymbols(symbols) {
  logger.log(`Perform lookup for symbols: ${symbols}`);
  const symbolList = asArray(symbols);
  return YFinance.lookup({ symbols: symbolList }).catch((error) => {
    const string = symbolsToString(symbolList);
    const msg = `Error looking up symbols: ${string}`;
    logger.error(error, msg);
    throw new Error(msg);
  });
}

module.exports = function lookup(
  symbols,
  prefix,
  id,
  respond,
  { watchSymbols, stopWatchSymbols, optionChain }
) {
  if (!symbols || symbols.length <= 0) {
    Help.printHelp(prefix, id, respond);
    return;
  }

  Command.process(
    id,
    lookupSymbols(symbols)
      .then(OptionChain.getOptionsChain(optionChain))
      .then((result) => {
        return {
          result,
          extras: { watchSymbols, stopWatchSymbols },
        };
      }),
    respond
  );
};
