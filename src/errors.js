const Koa = require('koa');

/**
 * general app error
 */
class AppError extends Error {
  /**
   * @param {{
   *  name: String,
   *  httpCode: Number,
   *  description: String,
   *  isOperational: Boolean
   * }} props
   */
  constructor(props = {}) {
    super(props.description);

    // restore prototype chain
    Object.setPrototypeOf(this, new.target.prototype);

    this.name = props.name;
    this.httpCode = props.httpCode;
    this.isOperational = props.isOperational;

    Error.captureStackTrace(this);
  }

  /**
   * @param {Koa.Request} ctx
   * @param {Error} error
   */
  static parse(ctx, error) {
    if (error instanceof AppError) {
      ctx.throw(error.httpCode, error);
    };
    ctx.throw(500, error.message);
  }
};

module.exports = {
  AppError,
};
