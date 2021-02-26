const OptionChain = require("./optionchain");

module.exports = {
  optionChain: function optionChain({ symbol, weekOffset }) {
    return OptionChain.optionChain(symbol, weekOffset);
  },
};
