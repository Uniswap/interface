import { ApolloLink, createHttpLink } from '@apollo/client'
import { onError } from '@apollo/client/link/error'
import { RestLink } from 'apollo-link-rest'
import { config } from 'uniswap/src/config'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { getVersionHeader } from 'uniswap/src/data/constants'
import { logger } from 'utilities/src/logger/logger'
import { isMobileApp } from 'utilities/src/platform'
import { REQUEST_SOURCE } from 'utilities/src/platform/requestSource'

// Handles fetching data from REST APIs
// Responses will be stored in graphql cache
export const getRestLink = (): ApolloLink => {
  const restUri = uniswapUrls.apiBaseUrl

  return new RestLink({
    uri: restUri,
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': config.uniswapApiKey,
      'x-request-source': REQUEST_SOURCE,
      'x-app-version': getVersionHeader(),
      Origin: uniswapUrls.requestOriginUrl,
    },
  })
}

export interface CustomEndpoint {
  url: string
  key: string
}

export const getCustomGraphqlHttpLink = (endpoint: CustomEndpoint): ApolloLink =>
  createHttpLink({
    uri: endpoint.url,
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': endpoint.key,
      'x-request-source': REQUEST_SOURCE,
      'x-app-version': getVersionHeader(),
      // TODO: [MOB-3883] remove once API gateway supports mobile origin URL
      Origin: uniswapUrls.apiOrigin,
    },
  })

export const getGraphqlHttpLink = (): ApolloLink =>
  createHttpLink({
    uri: uniswapUrls.graphQLUrl,
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': config.uniswapApiKey,
      'x-request-source': REQUEST_SOURCE,
      'x-app-version': getVersionHeader(),
      // TODO: [MOB-3883] remove once API gateway supports mobile origin URL
      Origin: uniswapUrls.apiOrigin,
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
  networkErrorSamplingRate = APOLLO_NETWORK_ERROR_SAMPLING_RATE,
): ApolloLink {
  // Log any GraphQL errors or network error that occurred
  const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
    if (graphQLErrors) {
      const operationName = operation.operationName
      const operationVariables = JSON.stringify(operation.variables)
      graphQLErrors.forEach(({ message, locations, path }) => {
        sample(
          () =>
            logger.error(new Error(`GraphQL ${operationName} error: ${message}`), {
              tags: {
                file: 'data/links',
                function: 'getErrorLink',
              },
              extra: { message, locations, path, operationName, operationVariables },
            }),
          graphqlErrorSamplingRate,
        )
      })
    }
    // We use DataDog to catch network errors on Mobile
    if (networkError && !isMobileApp) {
      sample(
        () => logger.error(networkError, { tags: { file: 'data/links', function: 'getErrorLink' } }),
        networkErrorSamplingRate,
      )
    }
  })

  return errorLink
}

export function getPerformanceLink(
  sendAnalyticsEvent: (args: Record<string, string>) => void,
  samplingRate = APOLLO_PERFORMANCE_SAMPLING_RATE,
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
        samplingRate,
      )

      return data
    })
  })
}
