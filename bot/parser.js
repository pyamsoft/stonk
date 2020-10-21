function formatSymbol(symbol) {
  return symbol;
}

function formatAmountDirection(changeAmount) {
  return changeAmount === 0 ? "" : changeAmount > 0 ? "+" : "-";
}

function formatPrice(price) {
  return `${price.toFixed(2)}`;
}

function formatChangePercent(percent) {
  return `${Math.abs(percent).toFixed(2)}%`;
}

function formatChangeAmount(change) {
  return `${Math.abs(change).toFixed(2)}`;
}

function formatQuote({ symbol, price, changeAmount, changePercent }) {
  return `
**${formatSymbol(symbol)}**
\`\`\`diff
${formatPrice(price)}

${formatAmountDirection(changeAmount)} ${formatChangeAmount(
    changeAmount
  )} (${formatChangePercent(changePercent)})
\`\`\``;
}

function parseResults({ symbols, parser, data }) {
  let message = "";
  for (const symbol of symbols) {
    const quote = data[symbol];
    if (quote) {
      message += formatQuote(parser(quote));
    } else {
      message += `Unable to find data for: \$${symbol}`;
    }
    message += "\n";
  }

  return message;
}

module.exports = {
  parse: ({ symbols, data, parser }) => {
    return parseResults({ symbols, data, parser });
  },
};
