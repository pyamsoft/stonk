function bucketOtmItm(options, isCall) {
  let otm = [];
  let itm = [];
  for (const opt of options) {
    const { option } = opt;
    const { inTheMoney } = option;
    if (inTheMoney) {
      itm.push(opt);
    } else {
      otm.push(opt);
    }
  }

  // Sort by closest to the money
  otm = otm.sort((o1, o2) => {
    // Out of the money sorts by lowest to highest
    const o1Strike = o1.strike;
    const o2Strike = o2.strike;
    if (isCall) {
      return o1Strike - o2Strike;
    } else {
      return o2Strike - o1Strike;
    }
  });

  itm = itm.sort((o1, o2) => {
    // In the money sorts by highest to lowest
    const o1Strike = o1.strike;
    const o2Strike = o2.strike;
    if (isCall) {
      return o2Strike - o1Strike;
    } else {
      return o1Strike - o2Strike;
    }
  });

  // Grab the 5 closest
  otm = otm.slice(0, 5);
  itm = itm.slice(0, 5);

  return {
    otm: otm.map((o) => o.option),
    itm: itm.map((o) => o.option),
  };
}

function bucketByExpirationDate(options) {
  const dates = {};

  const sortedOptions = options.sort((o1, o2) => {
    // Sort by expiration date earliest to latest
    const o1Expiration = o1.expiration;
    const o2Expiration = o2.expiration;
    return o1Expiration - o2Expiration;
  });

  for (const opt of sortedOptions) {
    const { option } = opt;
    const { expiration } = option;
    if (!dates[expiration]) {
      dates[expiration] = [];
    }
    dates[expiration].push(opt);
  }

  return dates;
}

function process(options, isCall) {
  const bucketed = bucketByExpirationDate(options);

  for (const date of Object.keys(bucketed)) {
    bucketed[date] = bucketOtmItm(bucketed[date], isCall);
  }

  return bucketed;
}

function getRawValue(thing) {
  return thing.raw;
}

function getFormattedValue(thing) {
  return thing.fmt;
}

function processOption(option) {
  const {
    percentChange,
    strike,
    change,
    inTheMoney,
    impliedVolatility,
    volume,
    expiration,
    bid,
    ask,
  } = option;
  return {
    inTheMoney,
    percent: getFormattedValue(percentChange),
    strike: getFormattedValue(strike),
    amount: getFormattedValue(change),
    iv: getFormattedValue(impliedVolatility),
    expiration: getFormattedValue(expiration),
    bid: getFormattedValue(bid),
    ask: getFormattedValue(ask),

    // No volume, this field is excluded
    volume: volume ? getFormattedValue(volume) : "0",
  };
}

function processOptions(options) {
  const result = [];
  for (const option of options) {
    const opt = processOption(option);
    if (opt) {
      result.push({
        strike: getRawValue(option.strike),
        expiration: getRawValue(option.expiration),
        option: opt,
      });
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
    calls: process(allCalls, true),
    puts: process(allPuts, false),
  };
}

module.exports = {
  newOptionChain,
};
