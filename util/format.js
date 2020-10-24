function code(message) {
  return `\`${message}\``;
}

function codeBlock(message) {
  return `\`\`\`${message}\`\`\``;
}

module.exports = {
  code,
  codeBlock,
};
