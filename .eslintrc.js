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
        'quotes': [2, 'single', { 'avoidEscape': true }],
        'semi': [
            'error',
            'always'
        ], 
        'no-useless-escape': 'off'
    }
};
