function create(timeout) {
  const map = {};

  function invalidate() {
    const now = new Date();

    // Clear out any stale messages
    for (const id of Object.keys(map)) {
      const oldData = map[id];
      if (!oldData) {
        continue;
      }

      for (const stock of Object.keys(oldData)) {
        const oldStock = oldData[stock];
        const { lastUsed } = oldStock;
        if (now.valueOf() - timeout > lastUsed.valueOf()) {
          map[id][stock] = null;
        }
      }
    }
  }

  return {
    insert: function insert(id, stockSymbol, message) {
      if (!map[id]) {
        map[id] = {};
      }
      map[id][stockSymbol] = {
        message,
        lastUsed: new Date(),
      };
      invalidate();
    },

    get: function get(id, stockSymbol) {
      if (!id) {
        return null;
      }

      const cached = map[id];
      if (!cached) {
        return null;
      }

      const stock = cached[stockSymbol];
      if (!stock) {
        return null;
      }

      return stock.message;
    },
  };
}

module.exports = {
  create,
};
