module.exports = {
  // ...
  // Configuration options accepted by the `relay-compiler` command-line tool and `babel-plugin-relay`.
  src: './src',
  language: 'typescript', // "javascript" | "typescript" | "flow"
  schema: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3',
  exclude: ['**/node_modules/**', '**/__mocks__/**', '**/__generated__/**'],
}
