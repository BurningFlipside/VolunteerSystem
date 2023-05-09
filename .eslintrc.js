/* global module */
module.exports = {
  'env': {
    'browser': true,
    'es2021': true
  },
  'plugins': [
    'security'
  ],
  'extends': [
    'plugin:security/recommended',
    'eslint:recommended'
  ],
  'parserOptions': {
    'ecmaVersion': 'latest'
  },
  'rules': {
    'block-spacing': 'error',
    'brace-style': 'error',
    'camelcase': 'error',
    'curly': 'error',
    'eqeqeq': 'error',
    'indent': [
      'error',
      2,
      {
        'SwitchCase': 1
      }
    ],
    'linebreak-style': [
      'error',
      'unix'
    ],
    'no-else-return': 'error',
    'no-shadow': 'error',
    'quotes': [2, 'single', { 'avoidEscape': true }],
    'semi': [
      'error',
      'always'
    ], 
    'semi-spacing': 'error',
    'no-useless-escape': 'off'
  }
};
