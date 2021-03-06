const Logger = require("../../logger");
const Watch = require("./watch");
const StopWatch = require("./stopwatch");
const Options = require("./options");

const logger = Logger.tag("bot/option/index");

module.exports = {
  process: function process(rawOptions) {
    if (!rawOptions) {
      return {};
    }

    const opts = rawOptions.split(",").map((s) => s.toUpperCase());
    logger.log(`Parse options: `, opts);
    const watch = Watch.process(opts);
    const stopWatch = StopWatch.process(opts);
    const optionChain = Options.process(opts);
    return { watch, stopWatch, optionChain };
  },
};
