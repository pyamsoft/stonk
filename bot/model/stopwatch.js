function newStopWatch(client) {
  return {
    setInterval: function setInterval(callback, timeout) {
      return client.setInterval(callback, timeout);
    },

    clearInterval: function clearInterval(interval) {
      return client.clearInterval(interval);
    },
  };
}

module.exports = {
  create: newStopWatch,
};
