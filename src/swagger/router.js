const path = require('path');
const yamljs = require('yamljs');
const koaSwagger = require('koa2-swagger-ui');

const Router = require('koa-router');

const { App } = require('../app');
const { createLogger } = require('../logger');


/**
 * @param {App} app
 */
const swaggerRouter = (app) => {
  const logger = createLogger('swaggerRouter');
  const spec = yamljs.load(path.join(__dirname, 'swagger.yml'));

  try {
    const opts = {
      prefix: '/swagger',
      ...(app.swagger || {}).options,
    };
    const router = new Router({ prefix: opts.prefix });

    router.get('/', koaSwagger({
      routePrefix: false,
      swaggerOptions: { spec },
    }));

    app.koa
      .use(router.routes())
      .use(router.allowedMethods());

    logger.info('route added');
  } catch (error) {
    logger.error(error);
  }
};

module.exports = {
  swaggerRouter,
};
