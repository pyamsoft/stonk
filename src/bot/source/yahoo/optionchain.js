const Logger = require("../../../logger");
const { jsonApi } = require("../../../util/api");
const { newOptionChain } = require("../../model/optionchain");
const { TdConfig } = require("../../../config");
const { DateTime } = require("luxon");

const logger = Logger.tag("bot/source/yahoo/optionchain");

function toOptionsDate(date) {
  return (
    date
      // set to sunday
      .endOf("week")
      // set back to friday
      .minus({ days: 2 })
      // To expected format
      .toFormat("yyyy-MM-dd")
  );
}

function generateOptionsUrl(symbol) {
  const params = new URLSearchParams();
  params.append("apikey", TdConfig.key);
  params.append("symbol", symbol);
  params.append("fromDate", toOptionsDate(DateTime.local()));
  params.append("toDate", toOptionsDate(DateTime.local().plus({ months: 2 })));
  return `https://api.tdameritrade.com/v1/marketdata/chains?${params.toString()}`;
}

module.exports = {
  optionChain: function optionChain(symbol) {
    logger.log("Lookup option chain for: ", symbol);
    return jsonApi(generateOptionsUrl(symbol)).then((data) => {
      const { callExpDateMap, putExpDateMap } = data;
      return newOptionChain(callExpDateMap, putExpDateMap);
    });
  },
};
