import { ApolloClient, InMemoryCache } from '@apollo/client'
import { Reference, relayStylePagination } from '@apollo/client/utilities'

const GRAPHQL_URL = 'https://2hm3d6i3bfb43hcx33dk56mfey.appsync-api.us-east-1.amazonaws.com/graphql'
if (!GRAPHQL_URL) {
  throw new Error('AWS URL MISSING FROM ENVIRONMENT')
}

export const apolloClient = new ApolloClient({
  connectToDevTools: true,
  uri: GRAPHQL_URL,
  headers: {
    'Content-Type': 'application/json',
    Origin: 'https://app.uniswap.org',
    'X-API-KEY': 'da2-pl5x75xr7rhwfezyhmmzemkz7u',
  },
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          nftBalances: relayStylePagination(),
          nftAssets: relayStylePagination(),
          nftActivity: relayStylePagination(),
          // tell apollo client how to reference Token items in the cache after being fetched by queries that return Token[]
          token: {
            read(_, { args, toReference }): Reference | undefined {
              return toReference({
                __typename: 'Token',
                chain: args?.chain,
                address: args?.address,
              })
            },
          },
        },
      },
      Token: {
        // key by chain, address combination so that Token(chain, address) endpoint can read from cache
        /**
         * NOTE: In any query for `token` or `tokens`, you must include the `chain` and `address` fields
         * in order for result to normalize properly in the cache.
         */
        keyFields: ['chain', 'address'],
        fields: {
          address: {
            read(address: string | null): string | null {
              // backend endpoint sometimes returns checksummed, sometimes lowercased addresses
              // always use lowercased addresses in our app for consistency
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
