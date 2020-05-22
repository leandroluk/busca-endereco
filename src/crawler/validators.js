const { AppError } = require('../errors');
const errors = require('./errors');
const constants = require('./constants');

/**
 * @param {Object} args
 * @return {Object}
 */
function validateSearch(args) {
  try {
    if (
      // if not search or search isn't a string
      !args.search || typeof args.search !== 'string'
    ) throw errors.validation('search');

    if (
      // if exact is defined
      !constants.NOT_SEND.includes(args.exact) &&
      // if exact isn't in valid options
      !constants.BOOLEAN_CHAR_ENUM.includes(args.exact)
    ) throw errors.validation('exact');

    if (
      // if similar is defined
      !constants.NOT_SEND.includes(args.similar) &&
      // if similar isn't in valid options
      !constants.BOOLEAN_CHAR_ENUM.includes(args.similar)
    ) throw errors.validation('similar');

    if (
      // if cepType is defined
      !constants.NOT_SEND.includes(args.cepType) &&
      // if cepType isn't in valid options
      !constants.CEP_TYPE_ENUM.includes(args.cepType)
    ) throw errors.validation('cepType');

    return args;
  } catch (error) {
    throw new AppError(error);
  }
};

module.exports = {
  validateSearch,
};
