const restrictedGlobals = require('confusing-browser-globals')
const rulesDirPlugin = require('eslint-plugin-rulesdir')
rulesDirPlugin.RULES_DIR = '../../packages/uniswap/eslint_rules'

module.exports = {
  root: true,
  extends: ['@uniswap/eslint-config/extension'],
  plugins: ['rulesdir'],
  ignorePatterns: [
    'node_modules',
    '.react-router',
    'dist',
    'build',
    '.eslintrc.js',
    'manifest.json',
    '.nx',
    'vite.config.ts',
  ],
  parserOptions: {
    project: 'tsconfig.eslint.json',
    tsconfigRootDir: __dirname,
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  rules: {
    'rulesdir/i18n': 'error',
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      rules: {
        'no-relative-import-paths/no-relative-import-paths': [
          'error',
          {
            allowSameFolder: false,
          },
        ],
      },
    },
  ],
}
