/* eslint-env node */

const defaultConfig = require('./graphql.config')

module.exports = {
  src: defaultConfig.src,
  language: defaultConfig.language,
  schema: './src/graphql/thegraph/schema.graphql',
  exclude: ['**/node_modules/**', '**/__mocks__/**', '**/__generated__/**', '**/data/**'],
}
