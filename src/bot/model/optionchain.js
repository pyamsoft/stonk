function bucketOtmItm(options, isCall) {
  let otm = [];
  let itm = [];
  for (const strike of Object.keys(options)) {
    const option = options[strike][0];
    const { inTheMoney } = option;
    if (inTheMoney) {
      itm.push(option);
    } else {
      otm.push(option);
    }
  }

  // Sort by closest to the money
  otm = otm.sort((o1, o2) => {
    // Out of the money sorts by lowest to highest
    const o1Strike = o1.strikePrice;
    const o2Strike = o2.strikePrice;
    if (isCall) {
      return o1Strike - o2Strike;
    } else {
      return o2Strike - o1Strike;
    }
  });

  itm = itm.sort((o1, o2) => {
    // In the money sorts by highest to lowest
    const o1Strike = o1.strikePrice;
    const o2Strike = o2.strikePrice;
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
    otm: otm.map((o) => processOption(o)),
    itm: itm.map((o) => processOption(o)),
  };
}

function process(options, isCall) {
  const bucketed = [];
  for (const date of Object.keys(options)) {
    const key = date.substring(0, date.length - 2);
    bucketed[key] = bucketOtmItm(options[date], isCall);
  }

  return bucketed;
}

function getPrice(thing, or) {
  return getValue(thing ? thing.toFixed(2) : or);
}

function getValue(thing, or) {
  return `${thing ? thing : or}`;
}

function processOption(option) {
  const {
    strikePrice,
    inTheMoney,
    volatility,
    delta,
    gamma,
    totalVolume,
    bid,
    ask,
  } = option;

  return {
    inTheMoney,
    strike: getPrice(strikePrice, 0.0),
    iv: getValue(volatility, 0.0),
    bid: getPrice(bid, 0.0),
    ask: getPrice(ask, 0.0),
    volume: getValue(totalVolume, 0),
    delta: getValue(delta, 0),
    gamma: getValue(gamma, 0),
  };
}

function newOptionChain(calls, puts) {
  return {
    calls: process(calls, true),
    puts: process(puts, false),
  };
}

module.exports = {
  newOptionChain,
};
