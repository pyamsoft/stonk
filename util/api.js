const fetch = require("node-fetch");

function api(url) {
  return fetch(url).then((res) => {
    if (res.status >= 400) {
      throw new Error(res.statusText);
    } else {
      return res.json();
    }
  });
}

module.exports = {
  api,
};
