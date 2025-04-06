module.exports = {
    extends: [
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended',
      'plugin:react-hooks/recommended',
      'plugin:prettier/recommended'
    ],
    parser: '@typescript-eslint/parser',
    rules: {
      'prettier/prettier': ['warn', { endOfLine: 'auto' }]
    }
  };