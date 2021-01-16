const Logger = require("../../logger");
const News = require("./news");
const Watch = require("./watch");
const StopWatch = require("./stopwatch");

module.exports = {
  process: function process(what, rawOptions) {
    if (!what || !rawOptions) {
      return {};
    }

    const options = rawOptions.split(",").map((s) => s.toUpperCase());
    Logger.log(`Parse options for symbol '${what}'`, options);
    const news = News.process(options);
    const watch = Watch.process(options);
    const stopWatch = StopWatch.process(options);
    return { news, watch, stopWatch };
  },
};
