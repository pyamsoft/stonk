const Lookup = require("./lookup");
const Reverse = require("./reverse");
const Watch = require("./watch");
const OptionChain = require("./optionchain");
const { DateTime } = require("luxon");

module.exports = {
  lookup: Lookup,
  reverseLookup: Reverse,
  watchSymbols: Watch,
  getOptionPosition: async function getOptionPosition(position) {
    const options = await OptionChain.getOption(position.symbol, position.date);
    if (!options.calls || Object.keys(options.calls).length <= 0) {
      throw new Error(
        `Invalid option chain for ${
          position.symbol
        } on ${position.date.toLocaleString(DateTime.DATE_MED)}`
      );
    }

    const key = Object.keys(options.calls)[0];
    let chain;
    if (position.isCall) {
      chain = options.calls[key];
    } else {
      chain = options.puts[key];
    }

    let option = null;

    for (const o of chain.otm) {
      if (o.strike === position.strike) {
        option = o;
        break;
      }
    }

    if (!option) {
      for (const o of chain.itm) {
        if (o.strike === position.strike) {
          option = o;
          break;
        }
      }
    }

    if (!option) {
      throw new Error(
        `Invalid option for ${position.symbol} at ${
          position.strike
        } on ${position.date.toLocaleString(DateTime.DATE_MED)}`
      );
    }

    return option;
  },
};
