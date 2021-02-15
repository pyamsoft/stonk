const Lookup = require("./lookup");
const Query = require("./query");
const OptionChain = require("./optionchain");

module.exports = {
  optionChain: function optionChain({ symbol }) {
    return OptionChain.optionChain(symbol);
  },
  lookup: function lookup({ symbols }) {
    return Lookup.lookup(symbols.map((s) => s.toUpperCase()));
  },
  reverseLookup: function reverseLookup({ query, fuzzy }) {
    return Query.query(query, fuzzy);
  },
};
