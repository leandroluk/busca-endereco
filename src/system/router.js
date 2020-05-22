const Router = require('koa-router');
const { SystemInfo } = require('./info');

const { App } = require('../app');
const { createLogger } = require('../logger');

/**
 * @param {App} app
 */
const systemRouter = (app) => {
  const logger = createLogger('systemRouter');

  try {
    const opts = {
      prefix: '/@',
      ...(app.system || {}).options,
    };
    const router = new Router({ prefix: opts.prefix });

    router.get('/health', async (ctx) => {
      ctx.body = await SystemInfo.new();
    });

    app.koa
      .use(router.routes())
      .use(router.allowedMethods());

    logger.info('route added');
  } catch (error) {
    logger.error(error);
  }
};

module.exports = {
  systemRouter,
};
