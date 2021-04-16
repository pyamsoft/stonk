const Lookup = require("./lookup");
const Reverse = require("./reverse");
const Watch = require("./watch");
const OptionChain = require("./optionchain");

module.exports = {
  lookup: Lookup,
  reverseLookup: Reverse,
  watchSymbols: Watch,
  getOption: OptionChain.getOption,
};
