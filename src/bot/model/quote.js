function newQuote({ symbol, company, normal, afterHours }) {
  return {
    company,
    symbol,
    normal,
    afterHours,
  };
}

module.exports = {
  newQuote,
};
