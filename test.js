/* eslint-disable */

const { Crawler } = require('./src/crawler');

async function run() {
  const query = { search: 'franco' };
  const result = await new Crawler({ query }).run()
  console.log(result)
}
run();
