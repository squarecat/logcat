const logger = require('../src');

logger.init({
  name: 'leavemealone.app',
  url: 'http://localhost:9200',
  index: 'lma-logs'
});

logger.nodeLogger.info('[service-a]: this is a log for service a');
logger.nodeLogger.info('[service-b]: this is a log for service b');
logger.nodeLogger.info(
  '[service-c]: this is a log for service c with metadata',
  { extra: 'extra message', number: 10 }
);
