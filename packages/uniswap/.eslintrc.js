const rulesDirPlugin = require('eslint-plugin-rulesdir')
rulesDirPlugin.RULES_DIR = 'eslint_rules'

module.exports = {
  root: true,
  extends: ['@uniswap/eslint-config/native', '@uniswap/eslint-config/webPlatform'],
  plugins: ['rulesdir'],
  ignorePatterns: ['node_modules', '.turbo', '.eslintrc.js', 'codegen.ts'],
  parserOptions: {
    project: 'tsconfig.json',
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
      files: [
        'src/index.ts',
        'src/features/telemetry/constants/index.ts',
        'src/i18n/index.ts',
        'src/state/index.ts',
        'src/test/**',
      ],
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
            prefix: 'uniswap',
          },
        ],
      },
    },
    {
      files: ['**/features/gating/flags.ts'],
      rules: {
        'local-rules/custom-map-sort': 'error',
      },
    },
  ],
}
