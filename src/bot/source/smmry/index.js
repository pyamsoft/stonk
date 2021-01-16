const Tldr = require("./tldr");

module.exports = {
  create: function create(apiToken) {
    return {
      tldr: function ({ url }) {
        return Tldr.tldr(apiToken, url);
      },
    };
  },
};
