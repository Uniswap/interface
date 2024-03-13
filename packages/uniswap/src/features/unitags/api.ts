import { ApolloClient, from } from '@apollo/client'
import { RetryLink } from '@apollo/client/link/retry'
import { RestLink } from 'apollo-link-rest'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { createNewInMemoryCache } from 'uniswap/src/data/cache'
import { REQUEST_SOURCE } from 'uniswap/src/data/constants'
import { useRestQuery } from 'uniswap/src/data/rest'
import { UnitagAddressResponse, UnitagUsernameResponse } from 'uniswap/src/features/unitags/types'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'

const restLink = new RestLink({
  uri: `${uniswapUrls.unitagsApiUrl}`,
  headers: {
    'x-request-source': REQUEST_SOURCE,
    Origin: uniswapUrls.apiBaseUrl,
  },
})

const retryLink = new RetryLink()

export const unitagsApolloClient = new ApolloClient({
  link: from([retryLink, restLink]),
  cache: createNewInMemoryCache(),
  defaultOptions: {
    watchQuery: {
      // ensures query is returning data even if some fields errored out
      errorPolicy: 'all',
      fetchPolicy: 'cache-first',
    },
  },
})

export function addQueryParamsToEndpoint(
  endpoint: string,
  params: Record<string, string | number | boolean | undefined>
): string {
  const url = new URL(endpoint, uniswapUrls.appBaseUrl) // dummy base URL, we only need the path with query params
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      // only add param if its value is not undefined
      url.searchParams.append(key, String(value))
    }
  })
  return url.pathname + url.search
}

export function useUnitagQuery(
  username?: string
): ReturnType<typeof useRestQuery<UnitagUsernameResponse>> {
  return useRestQuery<UnitagUsernameResponse, Record<string, unknown>>(
    addQueryParamsToEndpoint('/username', { username }),
    { username }, // dummy body so that cache key is unique per query params
    ['available', 'requiresEnsMatch', 'username', 'metadata', 'address'], // return all fields
    {
      skip: !username, // skip if username is not provided
      ttlMs: ONE_MINUTE_MS * 2,
    },
    'GET',
    unitagsApolloClient
  )
}

export function useUnitagByAddressQuery(
  address?: Address
): ReturnType<typeof useRestQuery<UnitagAddressResponse>> {
  return useRestQuery<UnitagAddressResponse, Record<string, unknown>>(
    addQueryParamsToEndpoint('/address', { address }),
    { address }, // dummy body so that cache key is unique per query params
    ['username', 'metadata'], // return all fields
    {
      skip: !address, // skip if address is not provided
      ttlMs: ONE_MINUTE_MS * 2,
    },
    'GET',
    unitagsApolloClient
  )
}
