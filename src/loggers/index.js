const winston = require("winston");
const debug = require("debug");
require("winston-daily-rotate-file");

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

const NodeLogger = function ({ name, useDatadogTransport }) {
  const logger = winston.createLogger({
    level: "debug",
    levels: winston.config.syslog.levels,
    ...winstonOptions,
  });

  logger.add(
    new winston.transports.DailyRotateFile({
      filename: `${logPath}/${name}/${name}-%DATE%.log`,
      datePattern: "YYYY-MM-DD",
      zippedArchive: false,
      createSymlink: true,
      symlinkName: `${name}-current.log`,
      maxSize: "20m",
      maxFiles: "7d",
      format: winston.format.json(),
    })
  );

  if (useDatadogTransport) {
    if (!process.env.DATADOG_API_KEY) {
      throw new Error("Set DATADOG_API_KEY to use datadog transport");
    }
    const httpTransportOptions = {
      host: "http-intake.logs.datadoghq.com",
      path: `/api/v2/logs?dd-api-key=${process.env.DATADOG_API_KEY}&ddsource=nodejs&service=${name}>`,
      ssl: true,
      format: winston.format.json(),
    };
    logger.add(new winston.transports.Http(httpTransportOptions));
  }

  if (!logger.warning) {
    logger.warning = logger.warn;
  } else if (!logger.warn) {
    logger.warn = logger.warning;
  }
  return logger;
};

module.exports.NodeLogger = NodeLogger;
