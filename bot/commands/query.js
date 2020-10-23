const YFinance = require("./yahoo");
const Logger = require("../../logger");

const DataSource = YFinance;

module.exports = {
  query: ({ query, fuzzy }) => {
    return DataSource.query({ query, fuzzy })
      .then((result) => {
        const { data } = result;
        Logger.log("Query results: ", JSON.stringify(data));
        return result;
      })
      .catch((error) => {
        const msg = `Error doing reverse lookup: ${error.message}`;
        Logger.error(error, msg);
        throw new Error(msg);
      });
  },
};
