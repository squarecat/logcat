const winston = require('winston');
const { ElasticsearchTransport } = require('@squarecat/winston-elasticsearch');
const debug = require('debug');
const nodeLogsMapping = require('./node-mapping');

winston.exitOnError = false;
const formatLog = winston.format.printf(({ timestamp, level, message, stack }) => {
  let msg = message;
  if (message.constructor === Object) {
    msg = JSON.stringify(message, null, 4);
  }
  if (stack) {
    return `${timestamp} ${level} ${msg}\n${stack}`;
  }
  return `${timestamp} ${level} ${msg}`;
});

const filterDebug = winston.format((log) => {
  const { level, message } = log;

  if (level !== 'debug' || debug.enabled('all')) return log;
  if (!message || typeof message !== 'string') return log;

  const matchDebug = message.match(/\[(.+)\]/);
  if (!matchDebug || debug.enabled(matchDebug[1])) {
    return log;
  }
  return false;
});

function nodeTransformer({ timestamp, level, message, meta: originalMeta }) {
  try {
    const name = this.client.__name;
    let meta = originalMeta || {};
    let m = message;
    let service = 'unknown';
    if (typeof message !== 'string') {
      if (message instanceof Error) {
        m = message.message;
        meta = {
          ...meta,
          stack: message.stack
        };
      } else if (message.toString() !== '[Object object]') {
        m = message.toString;
      } else {
        return;
      }
    } else {
      const matchService = m.match(/^\[(.+)\]: (.*)/);
      if (matchService) {
        service = matchService[1];
        m = matchService[2];
      }
    }

    return {
      '@timestamp': Date.now(),
      ingest_time: Date.now(),
      severity: level,
      message: m,
      meta,
      service,
      system_name: name
    };
  } catch (err) {
    console.error(err);
  }
}

const winstonOptions = {
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'DD-MM-YYYY HH:mm:ss'
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
      )
    })
  ]
};

const NodeLogger = function ({ index, client, name }) {
  const logger = winston.createLogger({
    level: 'debug',
    levels: winston.config.syslog.levels,
    ...winstonOptions
  });
  if (process.env.NODE_ENV === 'production') {
    logger.add(
      new winston.transports.File({
        filename: 'error.log',
        level: 'error',
        format: winston.format.combine(filterDebug(), formatLog)
      })
    );
    logger.add(
      new winston.transports.File({
        filename: 'combined.log',
        format: winston.format.combine(filterDebug(), formatLog)
      })
    );
    if (client) {
      const est = new ElasticsearchTransport({
        level: 'debug',
        index: client.__index,
        transformer: nodeTransformer,
        flushInterval: 5000,
        bufferLimit: 200,
        client,
        handleExceptions: true,
        handleRejections: true,
        exitOnError: false
      });
      est.on('error', (err) => {
        console.error(err.message);
      });
      logger.add(est);
    }
  }

  if (!logger.warning) {
    logger.warning = logger.warn;
  } else if (!logger.warn) {
    logger.warn = logger.warning;
  }
  return logger;
};

module.exports.NodeLogger = NodeLogger;
