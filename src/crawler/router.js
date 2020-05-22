const Router = require('koa-router');

const { App } = require('../app');
const { createLogger } = require('../logger');
const { AppError } = require('../errors');

const { Crawler } = require('./crawler');
const { validateSearch } = require('./validators');

/**
 * @param {App} app
 */
const crawlerRouter = async (app) => {
  const logger = createLogger('crawlerRouter');

  try {
    const config = {
      prefix: '/',
      ...(app.crawler || {}).options,
    };
    const router = new Router({ prefix: config.prefix });

    router.get('/', async (ctx) => {
      try {
        const query = validateSearch(ctx.request.query);
        ctx.body = await new Crawler({ query, proxy: config.proxy }).run();
      } catch (error) {
        AppError.parse(ctx, error);
      }
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
  crawlerRouter,
};
