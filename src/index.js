const { App } = require('./app');

const port = process.env.PORT;
const proxy = process.env.PROXY;

App.new({ port, proxy }).catch((err) => console.error(err));