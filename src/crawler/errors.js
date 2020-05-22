module.exports = {
  fetchPage: (page) => ({
    name: 'FetchPage',
    httpCode: 404,
    description: `Cannot fetch page of "${page}"`,
  }),
  validation: (property) => ({
    name: 'validation',
    httpCode: 400,
    description: `Invalid property "${property}"`,
  }),
};
