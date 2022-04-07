const Logger = require("../../logger");
const MessageParser = require("../message");
const WatchList = require("../watch");

const logger = Logger.tag("bot/command/watch");

function isValidPrice(price) {
  return price && price >= 0;
}

function isPassedPoint(point, price, notifyAbove) {
  if (!isValidPrice(point) || !isValidPrice(price)) {
    return false;
  }

  // If the original price is lower/higher than the watch point, this will fire.
  // That's what you want right?
  return notifyAbove ? price > point : price < point;
}

module.exports = function watch(
  author,
  { result, symbol, low, high },
  respond
) {
  if (!result || !result.data) {
    logger.warn("Watch command lookup returned error");
    return;
  }

  // Parse results
  const resultData = result.data[symbol];
  let newPrice;
  if (resultData.afterHours) {
    newPrice = resultData.afterHours.price;
  } else {
    newPrice = resultData.normal.price;
  }

  // Fire if low is passed
  if (isPassedPoint(low, newPrice, false)) {
    logger.log("Low point passed: ", symbol, low, newPrice);
    WatchList.markLowPassed({ symbol });
    respond(
      MessageParser.notify(author, {
        symbol,
        point: low,
        price: newPrice,
        notifyAbove: false,
        isAfterHours: !!resultData.afterHours,
      })
    );
  }

  // Fire if high is passed
  if (isPassedPoint(high, newPrice, true)) {
    logger.log("High point passed: ", symbol, high, newPrice);
    WatchList.markHighPassed({ symbol });
    respond(
      MessageParser.notify(author, {
        symbol,
        point: high,
        price: newPrice,
        notifyAbove: true,
        isAfterHours: !!resultData.afterHours,
      })
    );
  }
};
