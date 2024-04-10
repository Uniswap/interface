import { InMemoryCache, InMemoryCacheConfig } from '@apollo/client'
import { Reference, relayStylePagination } from '@apollo/client/utilities'

const injectTimestampForRestQueries = (config: InMemoryCacheConfig = {}): InMemoryCacheConfig => {
  if (
    config.typePolicies?.Query?.fields?.data &&
    'merge' in (config.typePolicies?.Query?.fields?.data ?? {})
  ) {
    throw new Error(
      'Invalid cache config: `data` field already has a `merge` function that conflicts with the injected `merge` function'
    )
  }

  return {
    ...config,
    typePolicies: {
      ...config.typePolicies,
      Query: {
        ...config.typePolicies?.Query,
        fields: {
          ...config.typePolicies?.Query?.fields,
          data: {
            ...config.typePolicies?.Query?.fields?.data,
            merge(_, incoming): unknown {
              return {
                ...incoming,
                // add a timestamp because there is no cache-ttl in Apollo and in some cases (i.e. routing API quotes) we cannot show stale quotes
                timestamp: Date.now(),
              }
            },
          },
        },
      },
    },
  }
}

export function createNewInMemoryCache(config: InMemoryCacheConfig = {}): InMemoryCache {
  // eslint-disable-next-line no-restricted-syntax
  return new InMemoryCache(injectTimestampForRestQueries(config))
}

export function setupWalletCache(): InMemoryCache {
  return createNewInMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          // relayStylePagination function unfortunately generates a field policy that ignores args
          // Note: all non-pagination related query args should be added for cache to work properly.
          // ^ This ensures that cache doesnt get overwritten by similar queries with different args (e.g. different filter on NFT Items)
          nftBalances: relayStylePagination(['ownerAddress']),
          nftAssets: relayStylePagination(['address', 'filter']),

          /*
           * CACHE REDIRECTS
           *
           * when queries require params, Apollo cannot return partial data from cache
           * because it will not know the `id` until data is received.
           * The following redirects set ids to values known ahead of time.
           *
           * NOTE: may require setting a Field policy to ensure ids are stored in the
           *      format we specify. See `token()` below for a full example.
           * see https://music.youtube.com/watch?v=twd4Pb4o_fU&feature=share
           */

          // simply use chain / address pair as id instead for tokens
          token: {
            read(_, { args, toReference }): Reference | undefined {
              return toReference({
                __typename: 'Token',
                chain: args?.chain,
                address: args?.address?.toLowerCase(),
              })
            },
          },

          // Ignore `valueModifiers` when caching `portfolios`.
          // IMPORTANT: This assumes that `valueModifiers` are always the same when querying `portfolios` across the entire app.
          portfolios: {
            keyArgs: ['chains', 'ownerAddresses'],
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
      // Disable normalizaton for these types.
      // Given that we would never query these objects directly, we want these to be stored by their parent instead of being normalized.
      Amount: { keyFields: false },
      AmountChange: { keyFields: false },
      Dimensions: { keyFields: false },
      TimestampedAmount: { keyFields: false },
    },
  })
}
