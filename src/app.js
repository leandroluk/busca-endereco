const Koa = require('koa');
const { Server } = require('http');
const cors = require('@koa/cors');
const koaBody = require('koa-body');
const compress = require('koa-compress');

const { createLogger } = require('./logger');

const { crawlerRouter } = require('./crawler');
const { systemRouter } = require('./system');
const { swaggerRouter } = require('./swagger');

/**
 * Application class for serve routes
 */
class App {
  /**
   * async new app for use when need add some async method
   * @param {{
   *  port: String,
   *  proxy: String
   * }} props
   * @return {Promise<App>}
   */
  static async new(props = {}) {
    return new Promise(async (resolve, reject) => {
      try {
        const app = new App(props);

        app.addMiddlewares();
        app.addErrorHandling();
        app.addRoutes();
        await app.listen();

        resolve(app);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * @param {{
   *  port: String,
   *  proxy: String
   * }} props
   */
  constructor(props = {}) {
    /** @type {String} */
    this.port = props.port || 3000;
    /** @type {String} */
    this.proxy = props.proxy;

    this.koa = new Koa();
    this.logger = createLogger(this);
    /** @type {Server} */
    this.server;
  }

  /**
   * add middlewares
   * @return {App}
   */
  addMiddlewares() {
    this.koa
      .use(compress())
      .use(cors())
      .use(koaBody());
    return this;
  }

  /**
   * add error handler
   * @return {App}
   */
  addErrorHandling() {
    this.koa.use(async (ctx, next) => {
      try {
        await next();
      } catch (error) {
        ctx.status = error.httpStatus || 500;
        ctx.body = error;
      }
    });
    return this;
  }

  /**
   * add routes
   * @return {App}
   */
  addRoutes() {
    systemRouter(this);
    crawlerRouter(this);
    swaggerRouter(this);
    return this;
  }

  /**
   * start application listening on port
   * @return {Promise<App>}
   */
  async listen() {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.koa.listen(this.port, () => {
          this.logger.info(`running on port ${this.port}`);
          resolve(this);
        });
      } catch (error) {
        reject(error);
      }
    });
  }
}

module.exports = {
  App,
};
