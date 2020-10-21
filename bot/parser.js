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
  return `${Math.abs(percent).toFixed(2)}%`;
}

function priceDirection(quote) {
  const change = quote.regularMarketChange;
  return directionToSign(change);
}

function priceChange(quote) {
  const change = quote.regularMarketChange;
  return `${Math.abs(change).toFixed(2)}`;
}

function parseQuote(quote) {
  return `
**${symbol(quote)}**
\`\`\`diff
${price(quote)}

${priceDirection(quote)} ${priceChange(quote)} (${percentChange(quote)})
\`\`\``;
}

function parseResults(symbols, results) {
  const { quoteResponse, error } = results;
  const { result } = quoteResponse;

  console.log("Raw result:", JSON.stringify(quoteResponse));

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
