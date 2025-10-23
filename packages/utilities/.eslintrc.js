const biomeSupportedRules = require('@uniswap/eslint-config/biome-supported')
const { reactNative: reactNativeImports } = require('@uniswap/eslint-config/restrictedImports')

module.exports = {
  root: true,
  extends: ['@uniswap/eslint-config/native', '@uniswap/eslint-config/webPlatform'],
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
      files: ['src/index.ts', 'src/platform/*', 'src/addresses/*', 'src/errors/*', 'src/platform/*'],
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
            prefix: 'utilities',
          },
        ],
      },
    },
  ],
  rules: {},
}
