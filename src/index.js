const { Client } = require('@elastic/elasticsearch');
const { NodeLogger, ImapLogger } = require('./loggers');

let client;

let loggers = {};

function init({ url, auth = {}, index, name }) {
  if (url) {
    client = new Client({
      node: url,
      auth: {
        username: auth.username,
        password: auth.password
      },
      sniffOnStart: false
    });
    client.__index = index;
    client.__name = name;
  }
  module.exports.nodeLogger = NodeLogger({ index, client });
  return loggers;
}

module.exports = {
  init
};
