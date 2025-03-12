const rulesDirPlugin = require('eslint-plugin-rulesdir')
rulesDirPlugin.RULES_DIR = '../../packages/uniswap/eslint_rules'

module.exports = {
  root: true,
  extends: ['@uniswap/eslint-config/native-app'],
  plugins: ['rulesdir'],
  ignorePatterns: [
    'node_modules',
    'dist',
    '.turbo',
    'build',
    '.eslintrc.js',
    'webpack.config.js',
    'webpack.dev.config.js',
    'manifest.json',
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
  rules: {},
  overrides: [
    {
      files: ['src/assets/index.ts', 'src/contentScript/index.tsx'],
      rules: {
        'check-file/no-index': 'off',
      },
    },
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
    {
      files: ['**/contentScript/injected.ts'],
      rules: {
        'no-restricted-syntax': [
          'error',
          {
            selector: 'CallExpression[callee.object.name="logger"][callee.property.name!=/^(debug)$/]',
            message:
              'Only logger.debug is allowed in this file. Please handle errors and info logs explicitly using ErrorLog and InfoLog message passing.',
          },
        ],
      },
    },
  ],
  rules: {
    'rulesdir/i18n': 'error',
  },
}
