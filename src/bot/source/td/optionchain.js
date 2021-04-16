const Logger = require("../../../logger");
const { jsonApi } = require("../../../util/api");
const { newOptionChain } = require("../../model/optionchain");
const { TdConfig } = require("../../../config");
const { DateTime } = require("luxon");

const logger = Logger.tag("bot/source/td/optionchain");

function toOptionsDate(date) {
  const optionsDate = date.toFormat("yyyy-MM-dd");
  logger.log("Options date: ", optionsDate);
  return optionsDate;
}

function generateOptionsUrl(symbol, weekOffset, date) {
  let expDate;
  if (date) {
    expDate = date;
  } else {
    expDate = DateTime.local().plus({ weeks: weekOffset || 0 });
  }

  const params = new URLSearchParams();
  params.append("apikey", TdConfig.key);
  params.append("symbol", symbol);
  params.append("fromDate", toOptionsDate(expDate.startOf("week")));
  params.append("toDate", toOptionsDate(expDate.endOf("week")));
  return `https://api.tdameritrade.com/v1/marketdata/chains?${params.toString()}`;
}

module.exports = {
  optionChain: function optionChain(symbol, weekOffset, date) {
    logger.log("Lookup option chain for: ", symbol);
    return jsonApi(generateOptionsUrl(symbol, weekOffset, date)).then(
      (data) => {
        const { callExpDateMap, putExpDateMap } = data;
        return newOptionChain(callExpDateMap, putExpDateMap);
      }
    );
  },
};
