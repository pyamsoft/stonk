function symbol(quote) {
  return quote.symbol;
}

function directionToSign(direction) {
  return direction === 0 ? "" : direction > 0 ? "+" : "-";
}

function price(quote) {
  const price = quote.regularMarketPrice;
  return `${price.toFixed(2)}`;
}

function percentChange(quote) {
  const percent = quote.regularMarketChangePercent;
  return `${directionToSign(percent)}${Math.abs(percent).toFixed(2)}%`;
}

function priceChange(quote) {
  const change = quote.regularMarketChange;
  return `${directionToSign(change)}${Math.abs(change).toFixed(2)}`;
}

function parseQuote(quote) {
  return `${symbol(quote)}: ${price(quote)} (${percentChange(
    quote
  )}) [${priceChange(quote)}]`;
}

function parseResults(symbols, results) {
  const { quoteResponse, error } = results;
  const { result } = quoteResponse;

  if (error) {
    return "Error looking up symbols";
  }

  let message = "";
  for (const symbol of symbols) {
    const quote = result.find((r) => r.symbol === symbol);
    if (quote) {
      message += parseQuote(quote);
    } else {
      message += `Unable to find data for: \$${symbol}`;
    }
    message += "\n";
  }

  return message;
}

module.exports = {
  parse: (symbols, data) => {
    return parseResults(symbols, data);
  },
};
