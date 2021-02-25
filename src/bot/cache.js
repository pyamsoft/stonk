function create(timeout) {
  const map = {};
  return {
    invalidate: function invalidate() {
      const now = new Date();

      // Clear out any stale messages
      for (const id of Object.keys(map)) {
        const oldData = map[id];
        if (!oldData) {
          continue;
        }

        const { lastUsed } = oldData;
        if (now.valueOf() - timeout > lastUsed.valueOf()) {
          map[id] = null;
        }
      }
    },

    insert: function insert(id, message) {
      map[id] = {
        message,
        lastUsed: new Date(),
      };
    },

    get: function get(id) {
      if (!id) {
        return null;
      }

      const cached = map[id];
      if (!cached) {
        return null;
      }

      return cached.message;
    },
  };
}

module.exports = {
  create,
};
