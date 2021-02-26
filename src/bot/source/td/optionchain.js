const Logger = require("../../../logger");
const { jsonApi } = require("../../../util/api");
const { newOptionChain } = require("../../model/optionchain");
const { TdConfig } = require("../../../config");
const { DateTime } = require("luxon");

const logger = Logger.tag("bot/source/yahoo/optionchain");

function toOptionsDate(date) {
  logger.log("Options date: ", date.toString());
  return date.toFormat("yyyy-MM-dd");
}

function generateOptionsUrl(symbol, weekOffset) {
  const date = DateTime.local().plus({ weeks: weekOffset || 0 });
  const params = new URLSearchParams();
  params.append("apikey", TdConfig.key);
  params.append("symbol", symbol);
  params.append("fromDate", toOptionsDate(date.startOf("week")));
  params.append("toDate", toOptionsDate(date.endOf("week")));
  return `https://api.tdameritrade.com/v1/marketdata/chains?${params.toString()}`;
}

module.exports = {
  optionChain: function optionChain(symbol, weekOffset) {
    logger.log("Lookup option chain for: ", symbol);
    return jsonApi(generateOptionsUrl(symbol, weekOffset)).then((data) => {
      const { callExpDateMap, putExpDateMap } = data;
      return newOptionChain(callExpDateMap, putExpDateMap);
    });
  },
};
