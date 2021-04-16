const OptionChain = require("./optionchain");

module.exports = {
  optionChain: function optionChain({ symbol, weekOffset, date }) {
    return OptionChain.optionChain(symbol, weekOffset, date);
  },
};
