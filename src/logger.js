const Logger = require('bunyan');

const packageJson = require('../package.json');

const logger = Logger.createLogger({
  name: packageJson.name,
  streams: [
    { stream: process.stdout, level: 'info' },
    {
      type: 'rotating-file',
      path: process.env.LOG_FILE || `${packageJson.name}.log`,
      period: '1d',
      count: 1000,
      level: 'debug',
    },
  ],
});

/**
 * @param {String|Object|Function} component
 * @return {Logger}
 */
function createLogger(component) {
  if (['function', 'object'].includes(typeof component)) {
    component = component.constructor.name;
  } else if (typeof component !== 'string') {
    throw new TypeError('invalid type component');
  }

  return logger.child({ component });
}

module.exports = {
  createLogger,
};
