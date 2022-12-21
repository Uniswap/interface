/* eslint-env node */

module.exports = {
  src: './src',
  language: 'typescript',
  schema: './src/graphql/data/schema.graphql',
  exclude: ['**/node_modules/**', '**/__mocks__/**', '**/__generated__/**', '**/thegraph/**'],
}
