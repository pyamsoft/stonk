const Logger = require("../../logger");

const logger = Logger.tag("model/optionchain.js");

function processOption(option) {
  logger.log("Process option: ", option);
}

function processOptions(options) {
  const result = [];
  for (const option of options) {
    const opt = processOption(option);
    if (opt) {
      result.push(opt);
    }
  }
  return result;
}

function newOptionChain(options) {
  let allCalls = [];
  let allPuts = [];

  for (const option of options) {
    const { calls, puts } = option;
    const optionCalls = processOptions(calls);
    const optionPuts = processOptions(puts);
    allCalls = [...allCalls, ...optionCalls];
    allPuts = [...allPuts, ...optionPuts];
  }
  return {
    calls: allCalls,
    puts: allPuts,
  };
}

module.exports = {
  newOptionChain,
};
