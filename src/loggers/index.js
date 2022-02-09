const winston = require("winston");
const debug = require("debug");

const logPath = process.env.LOG_PATH || "/var/www/logs";

winston.exitOnError = false;
const formatLog = winston.format.printf(
  ({ timestamp, level, message, stack }) => {
    let msg = message;
    if (message.constructor === Object) {
      msg = JSON.stringify(message, null, 4);
    }
    if (stack) {
      return `${timestamp} ${level} ${msg}\n${stack}`;
    }
    return `${timestamp} ${level} ${msg}`;
  }
);

const filterDebug = winston.format((log) => {
  const { level, message } = log;

  if (level !== "debug" || debug.enabled("all")) return log;
  if (!message || typeof message !== "string") return log;

  const matchDebug = message.match(/\[(.+)\]/);
  if (!matchDebug || debug.enabled(matchDebug[1])) {
    return log;
  }
  return false;
});

const winstonOptions = {
  format: winston.format.combine(
    winston.format.timestamp({
      format: "DD-MM-YYYY HH:mm:ss",
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    // always log to the console
    new winston.transports.Console({
      format: winston.format.combine(
        filterDebug(),
        winston.format.colorize(),
        winston.format.simple(),
        formatLog
      ),
    }),
  ],
};

const NodeLogger = function ({ name }) {
  const logger = winston.createLogger({
    level: "debug",
    levels: winston.config.syslog.levels,
    ...winstonOptions,
  });
  if (process.env.NODE_ENV === "production") {
    logger.add(
      new winston.transports.File({
        filename: "error.log",
        level: "error",
        format: winston.format.combine(filterDebug(), formatLog),
      })
    );
    logger.add(
      new winston.transports.File({
        filename: "combined.log",
        format: winston.format.combine(filterDebug(), formatLog),
      })
    );
    logger.add(
      new winston.transports.File({
        filename: `${logPath}/${name}.log`,
        format: format.json(),
      })
    );
  }

  if (!logger.warning) {
    logger.warning = logger.warn;
  } else if (!logger.warn) {
    logger.warn = logger.warning;
  }
  return logger;
};

module.exports.NodeLogger = NodeLogger;
