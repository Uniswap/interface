import { ApolloClient, FieldFunctionOptions, HttpLink, InMemoryCache } from '@apollo/client'
import { Reference, StoreObject, relayStylePagination } from '@apollo/client/utilities'
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
              return toReference({ __typename: 'Token', chain: args?.chain, address: args?.address?.toLowerCase() })
            },
          },
          // Ignore `valueModifiers` and `onRampAuth` when caching `portfolios`.
          // IMPORTANT: This assumes that `valueModifiers` are always the same when querying `portfolios` across the entire app.
          portfolios: {
            keyArgs: ['chains', 'ownerAddresses'],
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
          feeData: {
            // TODO(API-482): remove this once the backend bug is fixed.
            // There's a bug in our graphql backend where `feeData` can incorrectly be `null` for certain queries (`topTokens`).
            // This field policy ensures that the cache doesn't get overwritten with `null` values triggering unnecessary re-renders.
            merge: ignoreIncomingNullValue,
          },
          protectionInfo: {
            // TODO(API-482): remove this once the backend bug is fixed.
            // There's a bug in our graphql backend where `protectionInfo` can incorrectly be `null` for certain queries (`topTokens`).
            // This field policy ensures that the cache doesn't get overwritten with `null` values triggering unnecessary re-renders.
            merge: ignoreIncomingNullValue,
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
      // Disable normalization for these types.
      // Given that we would never query these objects directly, we want these to be stored by their parent instead of being normalized.
      Amount: { keyFields: false },
      AmountChange: { keyFields: false },
      Dimensions: { keyFields: false },
      TimestampedAmount: { keyFields: false },
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

function ignoreIncomingNullValue(
  existing: Reference | StoreObject,
  incoming: Reference | StoreObject,
  { mergeObjects }: FieldFunctionOptions<Record<string, unknown>, Record<string, unknown>>,
): Reference | StoreObject {
  if (existing && !incoming) {
    return existing
  }
  return mergeObjects(existing, incoming)
}
