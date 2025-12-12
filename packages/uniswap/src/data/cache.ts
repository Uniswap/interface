import { FieldFunctionOptions, InMemoryCache } from '@apollo/client'
import { Reference, relayStylePagination, StoreObject } from '@apollo/client/utilities'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { getValidAddress } from 'uniswap/src/utils/addresses'
import { currencyIdToAddress, currencyIdToChain } from 'uniswap/src/utils/currencyId'
import { isTestEnv } from 'utilities/src/environment/env'

export function setupSharedApolloCache(): InMemoryCache {
  return new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          // relayStylePagination function unfortunately generates a field policy that ignores args
          // Note: all non-pagination related query args should be added for cache to work properly.
          // ^ This ensures that cache doesnt get overwritten by similar queries with different args (e.g. different filter on NFT Items)
          nftBalances: relayStylePagination(['ownerAddress', 'filter']),
          nftAssets: relayStylePagination(['address', 'filter']),
          nftActivity: relayStylePagination(),

          /*
           * CACHE REDIRECTS
           *
           * When queries require params, Apollo cannot return partial data from cache
           * because it will not know the `id` until data is received.
           * The following redirects set ids to values known ahead of time.
           *
           * NOTE: may require setting a Field policy to ensure ids are stored in the
           *      format we specify. See `token()` below for a full example.
           * see https://music.youtube.com/watch?v=twd4Pb4o_fU&feature=share
           */

          // Cache redirects don't work in test environment, so we don't use them in tests
          ...(!isTestEnv()
            ? {
                // simply use chain / address pair as id instead for tokens
                token: {
                  read(_, { args, toReference }): Reference | undefined {
                    return toReference({
                      __typename: 'Token',
                      chain: args?.chain,
                      address: normalizeTokenAddressForCache(args?.address),
                    })
                  },
                },
              }
            : {}),

          // Ignore `valueModifiers` and `onRampAuth` when caching `portfolios`.
          // IMPORTANT: This assumes that `valueModifiers` are always the same when querying `portfolios` across the entire app.
          portfolios: {
            keyArgs: ['chains', 'ownerAddresses'],
          },
        },
      },
      Token: {
        /**
         * Key by `[chain, address]` so that when querying by `Token(chain, address)` we can read from cache.
         *
         * NOTE: In every query that returns a `Token` object, you must always request the `chain` and `address` fields
         *       in order for the result to be normalized properly in the cache.
         */
        keyFields: ['chain', 'address'],
        fields: {
          address: {
            read(address: string | null): string | null {
              return normalizeTokenAddressForCache(address)
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
            // Cache data may be lost when replacing the tokens array, so we either replace all or keep the existing array..
            merge: incomingOrExistingArray,
          },
        },
      },
      TokenProjectMarket: {
        fields: {
          priceHistory: {
            // This is here just to ignore the "cache may be lost" warning, as we do want this array to be overwritten when new data is available.
            merge: incomingOrExistingArray,
          },
        },
      },
      // Disable normalization for these types since we want them stored by their parent.
      Amount: {
        keyFields: false,
        // Add merge functions to suppress "Cache data may be lost" warnings
        merge: true,
      },
      AmountChange: { keyFields: false },
      Dimensions: { keyFields: false },
      TimestampedAmount: { keyFields: false },
    },
  })
}

// eslint-disable-next-line max-params
function ignoreIncomingNullValue(
  existing: Reference | StoreObject,
  incoming: Reference | StoreObject,
  { mergeObjects }: FieldFunctionOptions<Record<string, unknown>, Record<string, unknown>>,
): Reference | StoreObject {
  return mergeObjects(existing, incoming)
}

function incomingOrExistingArray(
  existing: unknown[] | undefined,
  incoming: unknown[] | undefined,
): unknown[] | undefined {
  return incoming ?? existing
}

export function normalizeCurrencyIdForMapLookup(currencyId: string): string
export function normalizeCurrencyIdForMapLookup(currencyId: string | undefined): string | undefined
export function normalizeCurrencyIdForMapLookup(currencyId: string | undefined): string | undefined {
  if (!currencyId) {
    return undefined
  }

  const chainId = currencyIdToChain(currencyId)
  const normalizedAddress = normalizeTokenAddressForCache(currencyIdToAddress(currencyId))
  return `${chainId}-${normalizedAddress}`
}

export function normalizeTokenAddressForCache(address: string): string
export function normalizeTokenAddressForCache(address: null): null
export function normalizeTokenAddressForCache(address: string | null): string | null
export function normalizeTokenAddressForCache(address: string | null): string | null {
  // Our graphql backend would sometimes return checksummed addresses and sometimes lowercase addresses.
  // In order to improve local cache hits, avoid unnecessary network requests, and avoid having duplicate `Token` items stored in the cache,
  // we use lowercase addresses when accessing the `Token` object from our local cache.
  // Solana addresses are case sensitive though, so this only applies to EVM addresses.

  if (address === 'NATIVE' || address === 'native') {
    return 'native' // lowercased native address for lowercase consistency
  }
  const normalizedEvmAddress = getValidAddress({ address, platform: Platform.EVM, withEVMChecksum: false })

  // if not a valid EVM address, must be SVM address
  return normalizedEvmAddress ?? address ?? null
}
