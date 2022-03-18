const { NodeLogger } = require("./loggers");

function init({ name, useDatadogTransport }) {
  module.exports.nodeLogger = NodeLogger({ name, useDatadogTransport });
}

function create({ name, ...options }) {
  return NodeLogger({ name, ...options });
}

module.exports = {
  init,
  create,
};
