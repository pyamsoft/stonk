const { textApi } = require("../../../util/api");

function generateNewsUrl(query, addStockToQuery) {
  return `https://news.google.com/search?q=${query}${
    addStockToQuery ? "%20stock" : ""
  }&hl=en-US&gl=US&ceid=US%3Aen`;
}

function getNews(query) {
  const url = generateNewsUrl(query);
  return textApi(url);
}

module.exports = {
  news: function news({ query, addStockToQuery }) {
    return getNews(query, addStockToQuery);
  },
};
