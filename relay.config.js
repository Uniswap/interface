module.exports = {
  src: './src',
  language: 'typescript',
  schema: './src/graphql/data/schema.graphql',
  // Need to exclude renamed queries during apollo migration. This file should be removed before migration is complete
  exclude: [
    '**/node_modules/**',
    '**/__mocks__/**',
    '**/__generated__/**',
    '**/thegraph/**',
    '**/graphql/data/nft/Collection.ts',
    '**/graphql/data/nft/Asset.ts',
    '**/graphql/data/nft/NftBalance.ts',
  ],
}
