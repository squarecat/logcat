const winston = require('winston');
const { ElasticsearchTransport } = require('winston-elasticsearch');

const nodeLogsMapping = require('./node-mapping');

const formatLog = winston.format.printf(({ timestamp, level, message }) => {
  if (message.constructor === Object) {
    return `${timestamp} ${level} ${JSON.stringify(message, null, 4)}`;
  }
  return `${timestamp} ${level} ${message}`;
});

function nodeTransformer({ timestamp, level, message, meta }) {
  try {
    const name = this.client.__name;
    const matchService = message.match(/^\[(.+)\]: (.*)/);
    let service = 'none';
    let m = message;
    if (matchService) {
      service = matchService[1];
      m = matchService[2];
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
        format: formatLog
      })
    );
    logger.add(
      new winston.transports.File({
        filename: 'combined.log',
        format: formatLog
      })
    );
  }

  console.log(`logging to index '${client.__index}'`);
  logger.add(
    new ElasticsearchTransport({
      level: 'debug',
      index: client.__index,
      transformer: nodeTransformer,
      flushInterval: 5000,
      bufferLimit: 200,
      client
    })
  );
  logger.warning = logger.warn;
  return logger;
};

module.exports.NodeLogger = NodeLogger;
