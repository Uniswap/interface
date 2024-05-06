import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client'
import { Reference, relayStylePagination } from '@apollo/client/utilities'
import { createSubscriptionLink } from 'utilities/src/apollo/SubscriptionLink'
import { splitSubscription } from 'utilities/src/apollo/splitSubscription'

const API_URL = process.env.REACT_APP_AWS_API_ENDPOINT
const REALTIME_URL = process.env.REACT_APP_AWS_REALTIME_ENDPOINT
const REALTIME_TOKEN = process.env.REACT_APP_AWS_REALTIME_TOKEN
if (!API_URL || !REALTIME_URL || !REALTIME_TOKEN) {
  throw new Error('AWS CONFIG MISSING FROM ENVIRONMENT')
}

const httpLink = new HttpLink({ uri: API_URL })

export const apolloClient = new ApolloClient({
  connectToDevTools: true,
  link: httpLink,
  headers: {
    'Content-Type': 'application/json',
    Origin: 'https://app.uniswap.org',
  },
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          nftBalances: relayStylePagination(['ownerAddress', 'filter']),
          nftAssets: relayStylePagination(),
          nftActivity: relayStylePagination(),
          token: {
            // Tokens should be cached by their chain/address, *not* by the ID returned by the server.
            // This is because the ID may change depending on fields requested.
            read(_, { args, toReference }): Reference | undefined {
              return toReference({ __typename: 'Token', chain: args?.chain, address: args?.address })
            },
          },
        },
      },
      Token: {
        // Tokens are cached by their chain/address (see Query.fields.token, above).
        // In any query for `token` or `tokens`, you *must* include `chain` and `address` fields in order
        // to properly normalize the result in the cache.
        keyFields: ['chain', 'address'],
        fields: {
          address: {
            // Always cache lowercased for consistency (backend sometimes returns checksummed).
            read(address: string | null): string | null {
              return address?.toLowerCase() ?? null
            },
          },
        },
      },
      TokenProject: {
        fields: {
          tokens: {
            // Cache data may be lost when replacing the tokens array, so retain all known tokens.
            merge(existing: unknown[] | undefined, incoming: unknown[] | undefined, { toReference }) {
              if (!existing || !incoming) {
                return existing ?? incoming
              } else {
                // Arrays must not be concatenated, or the cached array will grow indefinitely.
                // Instead, only append *new* elements to the array.
                const refs: Reference[] = existing.map((token: any) => toReference(token, true) as Reference)
                const refSet = refs.reduce((refSet, ref) => refSet.add(ref.__ref), new Set<string>())
                const newRefs = incoming
                  .map((token: any) => toReference(token, true) as Reference)
                  .filter((ref) => !refSet.has(ref.__ref))
                return [...refs, ...newRefs]
              }
            },
          },
        },
      },
      TokenMarket: {
        keyFields: ['id'],
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
})

// This is done after creating the client so that client may be passed to `createSubscriptionLink`.
const subscriptionLink = createSubscriptionLink({ uri: REALTIME_URL, token: REALTIME_TOKEN }, apolloClient)
apolloClient.setLink(splitSubscription(subscriptionLink, httpLink))
