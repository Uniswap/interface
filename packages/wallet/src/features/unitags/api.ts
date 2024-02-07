import { ApolloClient, from } from '@apollo/client'
import { RetryLink } from '@apollo/client/link/retry'
import { RestLink } from 'apollo-link-rest'
import axios from 'axios'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { uniswapUrls } from 'wallet/src/constants/urls'
import { createNewInMemoryCache } from 'wallet/src/data/cache'
import { useRestMutation, useRestQuery } from 'wallet/src/data/rest'
import {
  UnitagAddressResponse,
  UnitagChangeUsernameRequestBody,
  UnitagClaimEligibilityParams,
  UnitagClaimEligibilityResponse,
  UnitagClaimUsernameRequestBody,
  UnitagGetAvatarUploadUrlResponse,
  UnitagResponse,
  UnitagUpdateMetadataRequestBody,
  UnitagUpdateMetadataResponse,
  UnitagUsernameResponse,
} from 'wallet/src/features/unitags/types'

const restLink = new RestLink({
  uri: `${uniswapUrls.unitagsApiUrl}`,
})

const retryLink = new RetryLink()

const apolloClient = new ApolloClient({
  link: from([retryLink, restLink]),
  cache: createNewInMemoryCache(),
  defaultOptions: {
    watchQuery: {
      // ensures query is returning data even if some fields errored out
      errorPolicy: 'all',
      fetchPolicy: 'cache-and-network',
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
  return useRestQuery<UnitagUsernameResponse, Record<string, never>>(
    addQueryParamsToEndpoint('/username', { username }),
    {},
    ['available', 'requiresEnsMatch', 'username', 'metadata', 'address'], // return all fields
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
  typeof useRestMutation<UnitagResponse, UnitagClaimUsernameRequestBody>
> {
  return useRestMutation<UnitagResponse, UnitagClaimUsernameRequestBody>(
    '/username',
    ['success', 'errorCode'], // return all fields
    {},
    'POST',
    apolloClient
  )
}

export function useUnitagUpdateMetadataMutation(
  unitag: string
): ReturnType<
  typeof useRestMutation<UnitagUpdateMetadataResponse, UnitagUpdateMetadataRequestBody>
> {
  return useRestMutation<UnitagUpdateMetadataResponse, UnitagUpdateMetadataRequestBody>(
    `/username/${unitag}/metadata`,
    ['success', 'metadata'], // return all fields
    {},
    'PUT',
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

export function useUnitagGetAvatarUploadUrlQuery({
  username,
  skip,
}: {
  username?: string
  skip?: boolean
}): ReturnType<typeof useRestQuery<UnitagGetAvatarUploadUrlResponse>> {
  return useRestQuery<UnitagGetAvatarUploadUrlResponse, Record<string, never>>(
    addQueryParamsToEndpoint('/username/avatar-upload-url', { username }),
    {},
    ['success', 'avatarUrl', 'preSignedUrl', 's3UploadFields'], // return all fields
    { skip: !username || skip, ttlMs: ONE_SECOND_MS * 110 },
    'GET',
    apolloClient
  )
}

// TODO (MOB-1791): add signature authentication in headers
export async function getUnitagAvatarUploadUrl(
  username: string
): ReturnType<typeof axios.get<UnitagGetAvatarUploadUrlResponse>> {
  const avatarUploadUrl = `${uniswapUrls.unitagsApiUrl}/username/avatar-upload-url`
  return await axios.get<UnitagGetAvatarUploadUrlResponse>(avatarUploadUrl, {
    params: { username },
  })
}

export async function deleteUnitag(
  username: string,
  address: Address
): ReturnType<typeof axios.delete<UnitagResponse>> {
  const avatarUploadUrl = `${uniswapUrls.unitagsApiUrl}/username`
  return await axios.delete<UnitagResponse>(avatarUploadUrl, { data: { username, address } })
}

export function useUnitagChangeMutation(): ReturnType<
  typeof useRestMutation<UnitagResponse, UnitagChangeUsernameRequestBody>
> {
  return useRestMutation<UnitagResponse, UnitagChangeUsernameRequestBody>(
    '/username/change',
    ['success', 'errorCode'], // return all fields
    {},
    'POST',
    apolloClient
  )
}
