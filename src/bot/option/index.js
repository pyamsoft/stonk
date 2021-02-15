const Logger = require("../../logger");
const News = require("./news");
const Watch = require("./watch");
const StopWatch = require("./stopwatch");
const Options = require("./options");

module.exports = {
  process: function process(what, rawOptions) {
    if (!what || !rawOptions) {
      return {};
    }

    const opts = rawOptions.split(",").map((s) => s.toUpperCase());
    Logger.log(`Parse options for symbol '${what}'`, opts);
    const news = News.process(opts);
    const watch = Watch.process(opts);
    const stopWatch = StopWatch.process(opts);
    const optionChain = Options.process(opts);
    return { news, watch, stopWatch, optionChain };
  },
};
