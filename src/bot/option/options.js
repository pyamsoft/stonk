const logger = require("../../logger");
const { safeParseNumber } = require("../../util/number");

module.exports = {
  process: function process(options) {
    const possibleOptions = options.find((o) => o.indexOf("OPTIONS") >= 0);
    // OPTIONS[WEEK-OFFSET]
    if (possibleOptions) {
      // Week offset, 0 being this week, no negatives
      let weekOffset;

      const valuesSection = possibleOptions.replace(/OPTIONS/g, "");
      if (!valuesSection) {
        logger.log("Default weekoffset to 0 when nothing specified");
        weekOffset = 0;
      } else {
        // [WEEK-OFFSET]
        const values = valuesSection
          .replace(/\[/g, " ")
          .replace(/\]/g, " ")
          .trim()
          .split(/\s+/g);

        if (!values || values.length <= 0) {
          logger.log("Default weekoffset to 0 when nothing specified");
          weekOffset = 0;
        } else {
          // [ WEEK-OFFSET ]
          const [offset] = values;
          if (offset === undefined || offset === null) {
            logger.log("Default weekoffset to 0 when nothing specified");
            weekOffset = 0;
          } else {
            weekOffset = safeParseNumber(offset);
          }
        }
      }

      if (weekOffset < 0) {
        logger.warn("OPTIONS invalid week-offset", possibleOptions, weekOffset);
        return null;
      }

      return {
        weekOffset,
      };
    }

    return null;
  },
};
