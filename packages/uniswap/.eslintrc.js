const biomeSupportedRules = require('@uniswap/eslint-config/biome-supported')
const { reactNative: reactNativeImports } = require('@uniswap/eslint-config/restrictedImports')
const rulesDirPlugin = require('eslint-plugin-rulesdir')
rulesDirPlugin.RULES_DIR = 'eslint_rules'

module.exports = {
  root: true,
  extends: ['@uniswap/eslint-config/native', '@uniswap/eslint-config/webPlatform'],
  plugins: ['rulesdir'],
  ignorePatterns: ['node_modules', '.turbo', '.eslintrc.js', 'codegen.ts', '.nx'],
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
      files: ['**'],
      rules: {
        // Disable all ESLint rules that have been migrated to Biome
        ...biomeSupportedRules,
      },
    },
    {
      files: ['**/*.{ts,tsx}'],
      excludedFiles: ['**/*.native.*', '**/*.ios.*', '**/*.android.*'],
      rules: {
        '@typescript-eslint/no-restricted-imports': ['error', reactNativeImports],
      },
    },
    {
      files: [
        'src/index.ts',
        'src/features/telemetry/constants/index.ts',
        'src/features/telemetry/constants/trace/index.ts',
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
