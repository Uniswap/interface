import { ApolloClient, from, InMemoryCache } from '@apollo/client'
import { RetryLink } from '@apollo/client/link/retry'
import { RestLink } from 'apollo-link-rest'
import { uniswapUrls } from 'wallet/src/constants/urls'
import { useRestMutation, useRestQuery } from 'wallet/src/data/rest'
import {
  UnitagAddressResponse,
  UnitagClaimEligibilityParams,
  UnitagClaimEligibilityResponse,
  UnitagClaimResponse,
  UnitagClaimUsernameRequestBody,
  UnitagUsernameResponse,
} from 'wallet/src/features/unitags/types'

const restLink = new RestLink({
  uri: `${uniswapUrls.unitagsApiUrl}`,
})

const retryLink = new RetryLink()

const apolloClient = new ApolloClient({
  link: from([retryLink, restLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      // ensures query is returning data even if some fields errored out
      errorPolicy: 'all',
      fetchPolicy: 'no-cache',
      nextFetchPolicy: 'no-cache',
    },
  },
})

function addQueryParamsToEndpoint(
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
  return useRestQuery<UnitagUsernameResponse, Record<string, never>>(
    addQueryParamsToEndpoint('/username', { username }),
    {},
    ['available', 'requiresEnsMatch', 'metadata', 'address'], // return all fields
    {
      skip: !username, // skip if username is not provided
      fetchPolicy: 'no-cache',
    },
    'GET',
    apolloClient
  )
}

export function useUnitagByAddressQuery(
  address?: Address
): ReturnType<typeof useRestQuery<UnitagAddressResponse>> {
  return useRestQuery<UnitagAddressResponse, Record<string, never>>(
    addQueryParamsToEndpoint('/address', { address }),
    {},
    ['username', 'metadata'], // return all fields
    {
      skip: !address, // skip if address is not provided
      fetchPolicy: 'no-cache',
    },
    'GET',
    apolloClient
  )
}

export function useClaimUnitagMutation(): ReturnType<
  typeof useRestMutation<UnitagClaimResponse, UnitagClaimUsernameRequestBody>
> {
  return useRestMutation<UnitagClaimResponse, UnitagClaimUsernameRequestBody>(
    '/username',
    ['success', 'errorCode'], // return all fields
    {},
    'POST',
    apolloClient
  )
}

export function useUnitagClaimEligibilityQuery({
  address,
  deviceId,
  skip,
}: UnitagClaimEligibilityParams & { skip?: boolean }): ReturnType<
  typeof useRestQuery<UnitagClaimEligibilityResponse>
> {
  return useRestQuery<UnitagClaimEligibilityResponse, Record<string, never>>(
    addQueryParamsToEndpoint('/claim/eligibility', address ? { address, deviceId } : { deviceId }),
    {},
    ['canClaim', 'errorCode', 'message'], // return all fields
    { skip, fetchPolicy: 'no-cache' },
    'GET',
    apolloClient
  )
}
