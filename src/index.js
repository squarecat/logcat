const { NodeLogger } = require("./loggers");

function init({ name }) {
  module.exports.nodeLogger = NodeLogger({ name });
}

module.exports = {
  init,
};
