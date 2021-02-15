const Logger = require("../../logger");
const News = require("./news");
const Watch = require("./watch");
const StopWatch = require("./stopwatch");
const Options = require("./options");

const logger = Logger.tag("bot/option/index");

module.exports = {
  process: function process(what, rawOptions) {
    if (!what || !rawOptions) {
      return {};
    }

    const opts = rawOptions.split(",").map((s) => s.toUpperCase());
    logger.log(`Parse options for symbol '${what}'`, opts);
    const news = News.process(opts);
    const watch = Watch.process(opts);
    const stopWatch = StopWatch.process(opts);
    const optionChain = Options.process(opts);
    return { news, watch, stopWatch, optionChain };
  },
};
