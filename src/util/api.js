const axios = require("axios");

function jsonApi(url) {
  return axios({
    method: "GET",
    url,
  }).then((r) => r.data);
}

module.exports = {
  jsonApi,
};
