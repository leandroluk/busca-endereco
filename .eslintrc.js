module.exports = {
  'env': {
    'es6': true,
    'node': true,
    'jest': true,
  },
  'extends': [
    'google',
  ],
  'globals': {
    'Atomics': 'readonly',
    'SharedArrayBuffer': 'readonly',
  },
  'parserOptions': {
    'ecmaVersion': 2018,
    'sourceType': 'module',
  },
  'rules': {
    'object-curly-spacing': 'off',
    'indent': 'off',
    'no-unused-vars': 'off',
    'max-len': ['error', { 'code': 200, 'comments': 200 }],
  },
};
