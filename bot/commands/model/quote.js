function newQuote({ symbol, company, price, changeAmount, changePercent }) {
  return {
    company,
    symbol,
    price,
    changeAmount,
    changePercent,
  };
}

module.exports = {
  newQuote,
};
