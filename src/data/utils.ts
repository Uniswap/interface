import { InMemoryCache, NetworkStatus } from '@apollo/client'
import { onError } from '@apollo/client/link/error'
import { relayStylePagination } from '@apollo/client/utilities'
import { logger } from 'src/utils/logger'

export function isNonPollingRequestInFlight(networkStatus: NetworkStatus) {
  return (
    networkStatus === NetworkStatus.loading ||
    networkStatus === NetworkStatus.setVariables ||
    networkStatus === NetworkStatus.refetch
  )
}

export function isWarmLoadingStatus(networkStatus: NetworkStatus) {
  return networkStatus === NetworkStatus.loading
}

/**
 * Consider a query in an error state for UI purposes if query has no data, and
 * query has been loading at least once.
 */
export function isError(networkStatus: NetworkStatus, hasData: boolean) {
  return !hasData && networkStatus !== NetworkStatus.loading
}

// Samples error reports to reduce load on backend
// Recurring errors that we must fix should have enough occurrences that we detect them still
const APOLLO_GRAPHQL_ERROR_SAMPLING_RATE = 0.1
const APOLLO_NETWORK_ERROR_SAMPLING_RATE = 0.01

export function setupErrorLink(
  graphqlErrorSamplingRate = APOLLO_GRAPHQL_ERROR_SAMPLING_RATE,
  networkErrorSamplingRate = APOLLO_NETWORK_ERROR_SAMPLING_RATE
) {
  // Log any GraphQL errors or network error that occurred
  const errorLink = onError(({ graphQLErrors, networkError }) => {
    if (graphQLErrors) {
      graphQLErrors.forEach(({ message, locations, path }) => {
        if (Math.random() > graphqlErrorSamplingRate) return
        logger.error(
          'data/hooks',
          '',
          `[GraphQL Error]: Message: ${message}, Location: ${locations}, Path: ${path}`
        )
      })
    }
    if (networkError) {
      if (Math.random() > networkErrorSamplingRate) return
      logger.error('data/hooks', '', `[Network error]: ${networkError}`)
    }
  })

  return errorLink
}

export function setupCache(): InMemoryCache {
  const cache = new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          // relayStylePagination function unfortunately generates a field policy that ignores args
          nftBalances: relayStylePagination(['ownerAddress']),

          // tell apollo client how to reference Token items in the cache after being fetched by queries that return Token[]
          token: {
            read(_, { args, toReference }) {
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
        keyFields: ['chain', 'address'],
        fields: {
          address: {
            read(address: string | null) {
              // backend endpoint sometimes returns checksummed, sometimes lowercased addresses
              // always use lowercased addresses in our app for consistency
              return address?.toLowerCase() ?? null
            },
          },
        },
      },
    },
  })

  return cache
}
