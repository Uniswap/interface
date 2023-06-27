import { ApolloClient, InMemoryCache } from '@apollo/client'
import { Reference } from '@apollo/client/utilities'

const GRAPHQL_URL = process.env.REACT_APP_AWS_API_ENDPOINT
if (!GRAPHQL_URL) {
  throw new Error('AWS URL MISSING FROM ENVIRONMENT')
}
// url to testnet : http://13.59.22.26/subgraphs/name/pollum-io/pegasys-v2
// url to mainnet: https://rollux.graph.pegasys.fi/subgraphs/name/pollum-io/pegasys-v3
export const apolloClient = new ApolloClient({
  connectToDevTools: true,
  uri: 'https://rollux.graph.pegasys.fi/subgraphs/name/pollum-io/pegasys-v3',
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          token: {
            read(_, { toReference }): Reference | undefined {
              return toReference({
                __typename: 'Token',
              })
            },
          },
        },
      },
      Token: {
        keyFields: false,
        fields: {
          address: {
            read(address: string | null): string | null {
              return address?.toLowerCase() ?? null
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
})

// url to testnet : http://13.59.22.26/subgraphs/name/pollum-io/syscoin-blocks
// url to mainnet: https://rollux.graph.pegasys.fi/subgraphs/name/pollum-io/syscoin-blocks
export const blockClient = new ApolloClient({
  uri: 'https://rollux.graph.pegasys.fi/subgraphs/name/pollum-io/syscoin-blocks',
  cache: new InMemoryCache(),
  queryDeduplication: true,
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'no-cache',
    },
    query: {
      fetchPolicy: 'no-cache',
      errorPolicy: 'all',
    },
  },
})
