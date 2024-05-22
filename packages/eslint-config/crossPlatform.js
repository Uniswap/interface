const { crossPlatform: restrictedImports } = require('@uniswap/eslint-config/restrictedImports')

module.exports = {
  rules: {
    'no-restricted-imports': ['error', restrictedImports],
  },
}
