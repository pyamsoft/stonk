function newQuote(symbol, price, changeAmount, changePercent) {
  return {
    symbol,
    price,
    changeAmount,
    changePercent,
  };
}

module.exports = {
  newQuote,
};
