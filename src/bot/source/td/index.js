const OptionChain = require("./optionchain");

module.exports = {
  optionChain: function optionChain({ symbol }) {
    return OptionChain.optionChain(symbol);
  },
};
