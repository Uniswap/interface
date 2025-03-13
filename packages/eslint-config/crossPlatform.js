const { crossPlatform: restrictedImports } = require('@uniswap/eslint-config/restrictedImports')

module.exports = {
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      excludedFiles: ['*.native.*', '*.ios.*', '*.android.*'],
      rules: {
        'no-restricted-imports': ['error', restrictedImports],
      },
    },
  ],
}
