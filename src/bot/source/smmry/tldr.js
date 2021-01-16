const Logger = require("../../../logger");
const { jsonApi } = require("../../../util/api");

function generateUrl(token, url) {
  return `https://api.smmry.com?SM_API_KEY=${token}&SM_LENGTH=7&SM_URL=${url}`;
}

module.exports = {
  tldr: function tldr(token, url) {
    return jsonApi(generateUrl(token, url))
      .then((data) => {
        if (data && data.sm_api_title) {
          return {
            url,
            summary: data.sm_api_title,
          };
        }

        return { url };
      })
      .catch((error) => {
        Logger.error(error, "Error talking to smmry service");
        return { url };
      });
  },
};
