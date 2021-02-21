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

        for (const key of Object.keys(oldData)) {
          const { lastUsed } = oldData[key];
          if (now.valueOf() - timeout > lastUsed.valueOf()) {
            oldData[key] = null;
          }
        }
      }
    },
    insert: function insert(id, key, message) {
      const payload = map[id] || {};
      payload[key] = {
        message,
        lastUsed: new Date(),
      };
      map[id] = payload;
    },

    get: function get(id, key) {
      if (!id) {
        return null;
      }

      const cached = map[id];
      if (!cached) {
        return null;
      }

      const data = cached[key];
      if (!data) {
        return null;
      }

      return data.message;
    },
  };
}

module.exports = {
  create,
};
