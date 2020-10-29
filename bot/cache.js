function create(timeout) {
  const map = {};
  return {
    invalidate: function invalidate() {
      const now = new Date();

      // Clear out any stale messages
      for (const key of Object.keys(map)) {
        const old = map[key];
        if (old) {
          const { lastUsed } = old;
          if (now.valueOf() - timeout > lastUsed.valueOf()) {
            map[key] = null;
          }
        }
      }
    },
    insert: function insert(id, message) {
      const now = new Date();
      map[id] = {
        message,
        lastUsed: now,
      };
    },

    get: function get(id) {
      if (!id) {
        return null;
      }

      const cached = map[id];
      if (cached) {
        return cached.message;
      }

      return null;
    },
  };
}

module.exports = {
  create,
};
