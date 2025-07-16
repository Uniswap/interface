import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client'
import { setupSharedApolloCache } from 'uniswap/src/data/cache'

const API_URL = process.env.REACT_APP_AWS_API_ENDPOINT
if (!API_URL) {
  throw new Error('AWS API ENDPOINT MISSING FROM ENVIRONMENT')
}

const httpLink = new HttpLink({ uri: API_URL })

const SUBGRAPH_URL = process.env.REACT_APP_SUBGRAPH_ENDPOINT

const subgraphHttpLink = new HttpLink({ uri: SUBGRAPH_URL })

export const apolloClient = new ApolloClient({
  connectToDevTools: true,
  link: httpLink,
  headers: {
    'Content-Type': 'application/json',
    Origin: 'https://app.uniswap.org',
  },
  cache: setupSharedApolloCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
})

export const apolloSubgraphClient = new ApolloClient({
  connectToDevTools: true,
  link: subgraphHttpLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
})
