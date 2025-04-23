import { uniswapUrls } from 'uniswap/src/constants/urls'
import { createApiClient } from 'uniswap/src/data/apiClients/createApiClient'
import { SignedRequestParams, createSignedRequestBody, createSignedRequestParams } from 'uniswap/src/data/utils'
import {
  UnitagAddressRequest,
  UnitagAddressResponse,
  UnitagAddressesRequest,
  UnitagAddressesResponse,
  UnitagChangeUsernameRequestBody,
  UnitagClaimEligibilityRequest,
  UnitagClaimEligibilityResponse,
  UnitagClaimUsernameRequestBody,
  UnitagDeleteUsernameRequestBody,
  UnitagGetAvatarUploadUrlResponse,
  UnitagResponse,
  UnitagUpdateMetadataRequestBody,
  UnitagUpdateMetadataResponse,
  UnitagUsernameRequest,
  UnitagUsernameResponse,
} from 'uniswap/src/features/unitags/types'

const UnitagsApiClient = createApiClient({
  baseUrl: uniswapUrls.unitagsApiUrl,
})

export async function fetchUsername(params: UnitagUsernameRequest): Promise<UnitagUsernameResponse> {
  return await UnitagsApiClient.get<UnitagUsernameResponse>('/username', { params })
}

export async function fetchAddress(params: UnitagAddressRequest): Promise<UnitagAddressResponse> {
  return await UnitagsApiClient.get<UnitagAddressResponse>('/address', { params })
}

export async function fetchUnitagsByAddresses({ addresses }: UnitagAddressesRequest): Promise<UnitagAddressesResponse> {
  return await UnitagsApiClient.get<UnitagAddressesResponse>(
    `/addresses?addresses=${encodeURIComponent(addresses.join(','))}`,
  )
}

export async function fetchClaimEligibility(
  params: UnitagClaimEligibilityRequest,
): Promise<UnitagClaimEligibilityResponse> {
  return await UnitagsApiClient.get<UnitagClaimEligibilityResponse>('/claim/eligibility', { params })
}

// Post requests with signature authentication
export async function claimUnitag({
  data,
  address,
  signMessage,
}: SignedRequestParams<UnitagClaimUsernameRequestBody>): Promise<UnitagResponse> {
  const { requestBody, signature } = await createSignedRequestBody<UnitagClaimUsernameRequestBody>({
    data,
    address,
    signMessage,
  })

  return await UnitagsApiClient.post<UnitagResponse>('/username', {
    body: JSON.stringify(requestBody),
    headers: {
      'x-uni-sig': signature,
    },
  })
}

export async function updateUnitagMetadata({
  username,
  data,
  address,
  signMessage,
}: { username: string } & SignedRequestParams<UnitagUpdateMetadataRequestBody>): Promise<UnitagUpdateMetadataResponse> {
  const { requestBody, signature } = await createSignedRequestBody<UnitagUpdateMetadataRequestBody>({
    data,
    address,
    signMessage,
  })

  return await UnitagsApiClient.put(`/username/${username}/metadata`, {
    body: JSON.stringify(requestBody),
    headers: {
      'x-uni-sig': signature,
    },
  })
}

export async function changeUnitag({
  data,
  address,
  signMessage,
}: SignedRequestParams<UnitagChangeUsernameRequestBody>): Promise<UnitagResponse> {
  const { requestBody, signature } = await createSignedRequestBody<UnitagChangeUsernameRequestBody>({
    data,
    address,
    signMessage,
  })

  return await UnitagsApiClient.post<UnitagResponse>('/username/change', {
    body: JSON.stringify(requestBody),
    headers: {
      'x-uni-sig': signature,
    },
  })
}

export async function deleteUnitag({
  data,
  address,
  signMessage,
}: SignedRequestParams<UnitagDeleteUsernameRequestBody>): Promise<UnitagResponse> {
  const { requestBody, signature } = await createSignedRequestBody<UnitagDeleteUsernameRequestBody>({
    data,
    address,
    signMessage,
  })

  return UnitagsApiClient.delete<UnitagResponse>('/username', {
    body: JSON.stringify(requestBody),
    headers: {
      'x-uni-sig': signature,
    },
  })
}

export async function getUnitagAvatarUploadUrl({
  data,
  address,
  signMessage,
}: SignedRequestParams<{ username: string }>): Promise<UnitagGetAvatarUploadUrlResponse> {
  const { requestParams, signature } = await createSignedRequestParams<{
    username: string
  }>({ data, address, signMessage })

  return await UnitagsApiClient.get<UnitagGetAvatarUploadUrlResponse>('/username/avatar-upload-url', {
    params: requestParams,
    headers: {
      'x-uni-sig': signature,
    },
  })
}
