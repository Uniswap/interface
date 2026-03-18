const restrictedGlobals = require('confusing-browser-globals')
const rulesDirPlugin = require('eslint-plugin-rulesdir')
rulesDirPlugin.RULES_DIR = '../../packages/uniswap/eslint_rules'

module.exports = {
  root: true,
  extends: ['@uniswap/eslint-config/extension'],
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
    '.nx',
    'wxt.config.ts',
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
      files: ['**/contentScript/**'],
      rules: {
        'no-restricted-syntax': [
          'error',
          {
            selector: 'CallExpression[callee.object.name="logger"][callee.property.name!=/^(debug)$/]',
            message:
              'Only `logger.debug` is allowed in the content scripts. Please handle errors logs explicitly using `ErrorLog` message passing via `logContentScriptError`.',
          },
        ],
      },
    },
    {
      // We override this rule from the base config to allow access to `chrome`
      // in all Extension files except those in the `contentScript` folder.
      files: ['*.ts', '*.tsx'],
      excludedFiles: ['**/contentScript/**'],
      rules: {
        'no-restricted-globals': ['error'].concat(restrictedGlobals),
      },
    },
  ],
}
