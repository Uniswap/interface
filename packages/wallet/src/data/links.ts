import { ApolloLink, createHttpLink } from '@apollo/client'
import { onError } from '@apollo/client/link/error'
import { RestLink } from 'apollo-link-rest'
import { config } from 'uniswap/src/config'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { REQUEST_SOURCE } from 'uniswap/src/data/constants'
import { logger } from 'utilities/src/logger/logger'
import {
  EnsLookupParams,
  STUB_ONCHAIN_ENS_ENDPOINT,
  getOnChainEnsFetch,
} from 'wallet/src/features/ens/api'
import {
  BalanceLookupParams,
  STUB_ONCHAIN_BALANCES_ENDPOINT,
  getOnChainBalancesFetch,
} from 'wallet/src/features/portfolio/api'

const REST_API_URL = uniswapUrls.apiBaseUrl

// mapping from endpoint to custom fetcher, when needed
function getCustomFetcherMap(
  restUri: string
): Record<
  string,
  | ((body: BalanceLookupParams) => Promise<Response>)
  | ((body: EnsLookupParams) => Promise<Response>)
> {
  return {
    [restUri + STUB_ONCHAIN_BALANCES_ENDPOINT]: getOnChainBalancesFetch,
    [restUri + STUB_ONCHAIN_ENS_ENDPOINT]: getOnChainEnsFetch,
  }
}

// Handles fetching data from REST APIs
// Responses will be stored in graphql cache
export const getRestLink = (customRestUri?: string): ApolloLink => {
  const restUri = customRestUri ?? REST_API_URL

  // On-chain balances are fetched with ethers.provider
  // When we detect a request to the balances endpoint, we provide a custom fetcher.
  const fetchMap = getCustomFetcherMap(restUri)
  const customFetch: RestLink.CustomFetch = (uri, options) => {
    const customFetcher = fetchMap[uri.toString()]

    if (customFetcher) {
      return customFetcher(JSON.parse(options.body?.toString() ?? ''))
    }

    // Otherwise, use regular browser fetch
    return fetch(uri, options)
  }

  return new RestLink({
    customFetch,
    uri: restUri,
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': config.uniswapApiKey,
      'x-request-source': REQUEST_SOURCE,
      Origin: config.uniswapAppUrl,
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
      // TODO: [MOB-3883] remove once API gateway supports mobile origin URL
      Origin: uniswapUrls.apiBaseUrl,
    },
  })

export const getGraphqlHttpLink = (): ApolloLink =>
  createHttpLink({
    uri: uniswapUrls.graphQLUrl,
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': config.uniswapApiKey,
      'x-request-source': REQUEST_SOURCE,
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
            logger.error(`GraphQL error: ${message}`, {
              tags: {
                file: 'data/links',
                function: 'getErrorLink',
              },
              extra: { message, locations, path },
            }),
          graphqlErrorSamplingRate
        )
      })
    }
    if (networkError) {
      sample(
        () =>
          logger.error(networkError, { tags: { file: 'data/links', function: 'getErrorLink' } }),
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
