import { ApolloClient, InMemoryCache } from '@apollo/client'

// Overridable so cloud-function tests can point the worker at a local fixture
// server (see functions/fixtures) instead of the live gateway. In the Worker
// bundle the env read is resolved at build time via Vite `define`; on
// Vercel/Node it resolves at runtime. Unset everywhere except cloud-tests CI.
const GRAPHQL_ENDPOINT =
  process.env.CLOUD_FUNCTIONS_GRAPHQL_ENDPOINT_OVERRIDE || 'https://interface.gateway.uniswap.org/v1/graphql'

//TODO: Figure out how to make ApolloClient global variable
export default new ApolloClient({
  connectToDevTools: false,
  uri: GRAPHQL_ENDPOINT,
  headers: {
    'Content-Type': 'application/json',
    Origin: 'https://app.uniswap.org',
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.5735.110 Safari/537.36',
  },
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-first',
    },
  },
})
