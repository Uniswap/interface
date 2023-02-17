import { ApolloLink, NetworkStatus } from '@apollo/client'
import { onError } from '@apollo/client/link/error'
import { sendAnalyticsEvent } from 'src/features/telemetry'
import { MobileEventName } from 'src/features/telemetry/constants'
import { logger } from 'src/utils/logger'
import { isDevBuild } from 'src/utils/version'

export function isNonPollingRequestInFlight(networkStatus: NetworkStatus): boolean {
  return (
    networkStatus === NetworkStatus.loading ||
    networkStatus === NetworkStatus.setVariables ||
    networkStatus === NetworkStatus.refetch
  )
}

export function isWarmLoadingStatus(networkStatus: NetworkStatus): boolean {
  return networkStatus === NetworkStatus.loading
}

/**
 * Consider a query in an error state for UI purposes if query has no data, and
 * query has been loading at least once.
 */
export function isError(networkStatus: NetworkStatus, hasData: boolean): boolean {
  return !hasData && networkStatus !== NetworkStatus.loading
}

// Samples error reports to reduce load on backend
// Recurring errors that we must fix should have enough occurrences that we detect them still
const APOLLO_GRAPHQL_ERROR_SAMPLING_RATE = 0.1
const APOLLO_NETWORK_ERROR_SAMPLING_RATE = 0.01
const APOLLO_PERFORMANCE_SAMPLING_RATE = 0.5

export function sample(cb: () => void, rate: number): void {
  if (Math.random() < rate) {
    cb()
  }
}

export function setupErrorLink(
  graphqlErrorSamplingRate = APOLLO_GRAPHQL_ERROR_SAMPLING_RATE,
  networkErrorSamplingRate = APOLLO_NETWORK_ERROR_SAMPLING_RATE
): ApolloLink {
  // Log any GraphQL errors or network error that occurred
  const errorLink = onError(({ graphQLErrors, networkError }) => {
    if (graphQLErrors) {
      graphQLErrors.forEach(({ message, locations, path }) => {
        sample(
          () =>
            logger.error(
              'data/hooks',
              '',
              `[GraphQL Error]: Message: ${message}, Location: ${locations}, Path: ${path}`
            ),
          graphqlErrorSamplingRate
        )
      })
    }
    if (networkError) {
      sample(
        () => logger.error('data/hooks', '', `[Network error]: ${networkError}`),
        networkErrorSamplingRate
      )
    }
  })

  return errorLink
}

export function setupPerformanceLink(samplingRate = APOLLO_PERFORMANCE_SAMPLING_RATE): ApolloLink {
  if (!isDevBuild()) {
    return ApolloLink.empty()
  }

  return new ApolloLink((operation, forward) => {
    const startTime = Date.now()

    return forward(operation).map((data) => {
      const duration = Date.now() - startTime
      const dataSize = JSON.stringify(data).length

      sample(
        () =>
          sendAnalyticsEvent(MobileEventName.PerformanceGraphql, {
            dataSize,
            duration,
            operationName: operation.operationName,
          }),
        samplingRate
      )

      return data
    })
  })
}
