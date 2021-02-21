const MessageParser = require("../message");
const EMPTY_OBJECT = {};

module.exports = {
  /**
   * Handle a generic command
   *
   * @param {String} id
   * @param {Promise} command
   * @param {Function} callback
   */
  process: function process(id, command, callback) {
    command
      .then(({ result, extras }) => {
        MessageParser.parse(result, (cacheKey, message) => {
          callback(
            {
              result,
              cacheKey,
              skipCache: false,
              messageId: id,
              messageText: message,
            },
            extras
          );
        });
      })
      .catch((error) => {
        callback(
          {
            error,
            cacheKey: null,
            skipCache: true,
            messageId: id,
            messageText: error.message,
          },
          EMPTY_OBJECT
        );
      });
  },

  /**
   * Generic empty object
   */
  EMPTY_OBJECT: Object.freeze({}),

  /**
   * Object type
   */
  TYPE_OBJECT: typeof {},
};
