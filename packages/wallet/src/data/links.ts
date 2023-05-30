import { ApolloLink, createHttpLink } from '@apollo/client'
import { onError } from '@apollo/client/link/error'
import { config } from 'wallet/src/config'
import { uniswapUrls } from 'wallet/src/constants/urls'
import { logger } from 'wallet/src/features/logger/logger'

export const getHttpLink = (): ApolloLink =>
  createHttpLink({
    uri: uniswapUrls.graphQLUrl,
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': config.uniswapApiKey,
      // TODO: [MOB-3883] remove once API gateway supports mobile origin URL
      Origin: uniswapUrls.apiBaseUrl,
    },
  })

// Samples error reports to reduce load on backend
// Recurring errors that we must fix should have enough occurrences that we detect them still
const APOLLO_GRAPHQL_ERROR_SAMPLING_RATE = 0.1
const APOLLO_NETWORK_ERROR_SAMPLING_RATE = 0.01
const APOLLO_PERFORMANCE_SAMPLING_RATE = 0.01

export function sample(cb: () => void, rate: number): void {
  if (Math.random() < rate) {
    cb()
  }
}

export function getErrorLink(
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

export function getPerformanceLink(
  sendAnalyticsEvent: (args: Record<string, string>) => void,
  samplingRate = APOLLO_PERFORMANCE_SAMPLING_RATE
): ApolloLink {
  return new ApolloLink((operation, forward) => {
    const startTime = Date.now()

    return forward(operation).map((data) => {
      const duration = (Date.now() - startTime).toString()
      const dataSize = JSON.stringify(data).length.toString()

      sample(
        () =>
          sendAnalyticsEvent({
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
