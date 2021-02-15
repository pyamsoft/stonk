const { textApi } = require("../../../util/api");
const XmlParser = require("fast-xml-parser");
const Logger = require("../../../logger");

const logger = Logger.tag("bot/source/google/news");

function generateNewsUrl(query, addStockToQuery) {
  const params = new URLSearchParams();
  params.append("q", `${query}${addStockToQuery ? "%20stock" : ""}`);
  params.append("hl", "en-US");
  params.append("gl", "US");
  params.append("ceid", "US%3Aen");
  return `https://news.google.com/rss/search?${params.toString()}`;
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
  logger.log("Get news for: ", symbol);
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
      logger.error(error, "Error getting news for symbol ", symbol);
      return {
        symbol,
        news: [],
        error: error.message,
      };
    });
}

module.exports = {
  news: function news(symbols, addStockToQuery) {
    const promises = [];
    for (const s of symbols) {
      promises.push(getNews(s.toUpperCase(), addStockToQuery));
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
