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

  function all(id) {
    if (!id) {
      return null;
    }

    const cached = map[id];
    if (!cached) {
      return null;
    }

    return cached;
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

    getAll: function getAll(id) {
      const a = all(id);
      if (!a) {
        return null;
      }

      const result = {};
      for (const symbol of Object.keys(a)) {
        const cached = a[symbol];
        if (cached) {
          result[symbol] = cached.message;
        }
      }

      return result;
    },

    remove: function remove(id, symbol) {
      const cached = all(id);
      if (!cached) {
        return;
      }

      cached[symbol] = null;
    },

    get: function get(id, symbol) {
      const cached = all(id);
      if (!cached) {
        return null;
      }

      const stock = cached[symbol];
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
