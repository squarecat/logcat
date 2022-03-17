const { NodeLogger } = require("./loggers");

function init({ name, useDatadogTransport }) {
  module.exports.nodeLogger = NodeLogger({ name, useDatadogTransport });
}

module.exports = {
  init,
};
