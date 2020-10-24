const { textApi } = require("../../../util/api");
const XmlParser = require("fast-xml-parser");
const Logger = require("../../../logger");

function generateNewsUrl(query, addStockToQuery) {
  return `https://news.google.com/rss/search?q=${query}${
    addStockToQuery ? "%20stock" : ""
  }&hl=en-US&gl=US&ceid=US%3Aen`;
}

const publicationDateComparator = (i1, i2) => {
  if (i1.pubDate < i2.pubDate) {
    return 1;
  } else if (i1.pubDate > i2.pubDate) {
    return -1;
  } else {
    return 0;
  }
};

function getNews(symbol, addStockToQuery) {
  const url = generateNewsUrl(symbol, addStockToQuery);
  return textApi(url)
    .then((text) => XmlParser.parse(text))
    .then((result) => {
      return result.rss.channel.item
        .map((i) => i.link)
        .sort(publicationDateComparator)
        .slice(0, 5);
    })
    .then((news) => {
      return {
        symbol,
        news,
        error: null,
      };
    })
    .catch((error) => {
      Logger.error(error, "Error getting news for symbol ", symbol);
      return {
        symbol,
        news: [],
        error: error.message,
      };
    });
}

module.exports = {
  news: function news({ symbols, addStockToQuery }) {
    const promises = [];
    for (const symbol of symbols) {
      promises.push(getNews(symbol, addStockToQuery));
    }
    return Promise.all(promises).then((data) => {
      const results = {};
      for (const entry of data) {
        const { symbol } = entry;
        results[symbol] = entry;
      }

      return results;
    });
  },
};
