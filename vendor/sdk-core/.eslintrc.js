module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module'
  },
  extends: [
    'react-app',
    'prettier',
    'plugin:prettier/recommended'
  ],
  settings: {
    react: {
      version: '999.999.999'
    }
  }
};

