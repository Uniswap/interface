// eslint-disable-next-line @typescript-eslint/no-var-requires
const defaultConfig = require('./relay.config')

module.exports = {
  src: defaultConfig.src,
  language: defaultConfig.language,
  schema: './src/graphql/thegraph/schema.graphql',
  exclude: ['**/node_modules/**', '**/__mocks__/**', '**/__generated__/**', '**/data/**'],
}
