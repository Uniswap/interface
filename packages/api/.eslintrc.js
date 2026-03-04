const { reactNative: reactNativeImports } = require('@uniswap/eslint-config/restrictedImports')

module.exports = {
  extends: ['@uniswap/eslint-config/lib'],
  ignorePatterns: ['graphql.config.ts', 'stubs/**'],
  parserOptions: {
    tsconfigRootDir: __dirname,
  },
  overrides: [
    {
      files: ['**/*.{ts,tsx}'],
      excludedFiles: ['**/*.native.*', '**/*.ios.*', '**/*.android.*'],
      rules: {
        '@typescript-eslint/no-restricted-imports': ['error', reactNativeImports],
      },
    },
    {
      files: ['*.ts', '*.tsx'],
      rules: {
        'no-relative-import-paths/no-relative-import-paths': [
          'error',
          {
            allowSameFolder: false,
            prefix: '@universe/api',
          },
        ],
      },
    },
  ],
}
