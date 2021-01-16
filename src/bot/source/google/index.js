const News = require("./news");

module.exports = {
  news: function news({ symbols, addStockToQuery }) {
    return News.news(symbols, addStockToQuery);
  },
};
