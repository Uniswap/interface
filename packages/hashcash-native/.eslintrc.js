const biomeSupportedRules = require('@uniswap/eslint-config/biome-supported')

module.exports = {
  root: true,
  extends: ['@uniswap/eslint-config/native'],
  ignorePatterns: ['node_modules', 'lib', '.eslintrc.js'],
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  overrides: [
    {
      files: ['**'],
      rules: {
        ...biomeSupportedRules,
      },
    },
    {
      files: ['src/index.ts'],
      rules: {
        'check-file/no-index': 'off',
      },
    },
  ],
  rules: {},
}
