const biomeSupportedRules = require('./biome-supported')

module.exports = {
  root: true,
  extends: ['@uniswap/eslint-config/native', '@uniswap/eslint-config/webPlatform'],
  ignorePatterns: [
    'node_modules',
    '.turbo',
    '.eslintrc.js',
    'vitest.config.ts',
    'codegen.ts',
    '.nx',
    'scripts',
    'dist',
    'src/**/__generated__',
  ],
  parserOptions: {
    project: 'tsconfig.lint.json',
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
        // Disable all ESLint rules that have been migrated to Biome
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
