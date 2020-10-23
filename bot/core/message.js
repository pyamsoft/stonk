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

module.exports = {
  parse: function parse({ query, symbols, data }) {
    let message = "";
    if (query) {
      message += `Best guess for: \`${query}\``;
      message += "\n";
    }

    for (const symbol of symbols) {
      const quote = data[symbol];
      if (quote) {
        message += formatQuote(quote);
      } else {
        message += `Unable to find data for: \$${symbol}`;
      }
      message += "\n";
    }

    return message;
  },
};
