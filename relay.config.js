module.exports = {
  src: './src',
  language: 'typescript',
  schema: './src/graphql/data/schema.graphql',
  exclude: [
    '**/node_modules/**',
    '**/__mocks__/**',
    '**/__generated__/**',
    '**/thegraph/**',
    '**/graphql/data/nft/Details.ts',
    '**/graphql/data/nft/Collection.ts',
    '**/graphql/data/nft/Asset.ts',
    '**/graphql/data/nft/NftBalance.ts',
  ],
}
