const Lookup = require("./lookup");
const Query = require("./query");

module.exports = {
  lookup: function lookup({ symbols }) {
    return Lookup.lookup(symbols.map((s) => s.toUpperCase()));
  },
  reverseLookup: function reverseLookup({ query, fuzzy }) {
    return Query.query(query, fuzzy);
  },
};
