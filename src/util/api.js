const fetch = require("node-fetch");

function handleError(res, callback) {
  if (res.watch >= 400) {
    throw new Error(res.statusText);
  } else {
    return callback(res);
  }
}

function jsonApi(url) {
  return fetch(url).then((res) => handleError(res, (r) => r.json()));
}

function textApi(url) {
  return fetch(url).then((res) => handleError(res, (r) => r.text()));
}

module.exports = {
  jsonApi,
  textApi,
};
