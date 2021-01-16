const Logger = require("../../logger");
const { safeParseNumber } = require("../../util/number");

module.exports = {
  process: function process(options) {
    const possibleWatch = options.find((o) => o.indexOf("WATCH[") >= 0);
    // WATCH[LOW|HIGH]
    if (possibleWatch) {
      const valuesSection = possibleWatch.replace(/WATCH/g, "");
      if (!valuesSection) {
        Logger.warn("WATCH missing values section", possibleWatch);
        return null;
      }
      // [LOW|HIGH]
      const values = valuesSection
        .replace(/\[/g, " ")
        .replace(/\]/g, " ")
        .replace(/\|/g, " ")
        .trim()
        .split(/\s+/g);

      if (!values || values.length <= 0) {
        Logger.warn("WATCH missing values", possibleWatch, valuesSection);
        return null;
      }

      // [ LOW, HIGH ]
      const [low, high] = values;
      if (!low || !high) {
        Logger.warn("WATCH missing low high", possibleWatch, values);
        return null;
      }

      const lowNumber = safeParseNumber(low);
      const highNumber = safeParseNumber(high);
      if (lowNumber < 0 || highNumber < 0) {
        Logger.warn("WATCH invalid low high", possibleWatch, low, high);
        return null;
      }

      return {
        low: lowNumber,
        high: highNumber,
      };
    }

    return null;
  },
};
