import axios from 'axios'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { REQUEST_SOURCE } from 'uniswap/src/data/constants'
import { useRestQuery } from 'uniswap/src/data/rest'
import { addQueryParamsToEndpoint, unitagsApolloClient } from 'uniswap/src/features/unitags/api'
import {
  ProfileMetadata,
  UnitagChangeUsernameRequestBody,
  UnitagClaimEligibilityParams,
  UnitagClaimEligibilityResponse,
  UnitagClaimUsernameRequestBody,
  UnitagDeleteUsernameRequestBody,
  UnitagGetAvatarUploadUrlResponse,
  UnitagResponse,
  UnitagUpdateMetadataRequestBody,
  UnitagUpdateMetadataResponse,
} from 'uniswap/src/features/unitags/types'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'
import { createSignedRequestBody, createSignedRequestParams } from 'wallet/src/data/utils'
import { Account } from 'wallet/src/features/wallet/accounts/types'
import { SignerManager } from 'wallet/src/features/wallet/signing/SignerManager'

const generateAxiosHeaders = async (
  signature: string,
  firebaseAppCheckToken?: string
): Promise<Record<string, string>> => {
  return {
    'x-uni-sig': signature,
    'x-request-source': REQUEST_SOURCE,
    Origin: uniswapUrls.apiBaseUrl,
    ...(firebaseAppCheckToken && { 'x-firebase-app-check': firebaseAppCheckToken }),
  }
}

export function useUnitagClaimEligibilityQuery({
  address,
  deviceId,
  isUsernameChange,
  skip,
}: UnitagClaimEligibilityParams & { skip?: boolean }): ReturnType<
  typeof useRestQuery<UnitagClaimEligibilityResponse>
> {
  return useRestQuery<UnitagClaimEligibilityResponse, Record<string, unknown>>(
    addQueryParamsToEndpoint('/claim/eligibility', { address, deviceId, isUsernameChange }),
    { address, deviceId, isUsernameChange }, // dummy body so that cache key is unique per query params
    ['canClaim', 'errorCode', 'message'], // return all fields
    { skip, ttlMs: ONE_MINUTE_MS * 2 },
    'GET',
    unitagsApolloClient
  )
}

// Axios requests with signature authentication

export async function getUnitagAvatarUploadUrl({
  username,
  account,
  signerManager,
}: {
  username: string
  account: Account
  signerManager: SignerManager
}): ReturnType<typeof axios.get<UnitagGetAvatarUploadUrlResponse>> {
  const avatarUploadUrl = `${uniswapUrls.unitagsApiUrl}/username/avatar-upload-url`
  const { requestParams, signature } = await createSignedRequestParams<{ username: string }>(
    { username },
    account,
    signerManager
  )
  const headers = await generateAxiosHeaders(signature)
  return await axios.get<UnitagGetAvatarUploadUrlResponse>(avatarUploadUrl, {
    params: requestParams,
    headers,
  })
}

export async function deleteUnitag({
  username,
  account,
  signerManager,
}: {
  username: string
  account: Account
  signerManager: SignerManager
}): ReturnType<typeof axios.delete<UnitagResponse>> {
  const avatarUploadUrl = `${uniswapUrls.unitagsApiUrl}/username`
  const { requestBody, signature } = await createSignedRequestBody<UnitagDeleteUsernameRequestBody>(
    { username },
    account,
    signerManager
  )
  const headers = await generateAxiosHeaders(signature)
  return await axios.delete<UnitagResponse>(avatarUploadUrl, {
    data: requestBody,
    headers,
  })
}

export async function updateUnitagMetadata({
  username,
  metadata,
  clearAvatar,
  account,
  signerManager,
}: {
  username: string
  metadata: ProfileMetadata
  clearAvatar: boolean
  account: Account
  signerManager: SignerManager
}): ReturnType<typeof axios.put<UnitagUpdateMetadataResponse>> {
  const updateMetadataUrl = `${uniswapUrls.unitagsApiUrl}/username/${username}/metadata`
  const { requestBody, signature } = await createSignedRequestBody<UnitagUpdateMetadataRequestBody>(
    {
      metadata,
      clearAvatar,
    },
    account,
    signerManager
  )
  const headers = await generateAxiosHeaders(signature)
  return await axios.put<UnitagUpdateMetadataResponse>(updateMetadataUrl, requestBody, {
    headers,
  })
}

export async function claimUnitag({
  username,
  deviceId,
  metadata,
  account,
  signerManager,
  firebaseAppCheckToken,
}: {
  username: string
  deviceId: string
  metadata: ProfileMetadata
  account: Account
  signerManager: SignerManager
  firebaseAppCheckToken?: string
}): ReturnType<typeof axios.post<UnitagResponse>> {
  const claimUnitagUrl = `${uniswapUrls.unitagsApiUrl}/username`
  const { requestBody, signature } = await createSignedRequestBody<UnitagClaimUsernameRequestBody>(
    {
      username,
      deviceId,
      metadata,
    },
    account,
    signerManager
  )
  const headers = await generateAxiosHeaders(signature, firebaseAppCheckToken)
  return await axios.post<UnitagResponse>(claimUnitagUrl, requestBody, {
    headers,
  })
}

export async function changeUnitag({
  username,
  deviceId,
  account,
  signerManager,
}: {
  username: string
  deviceId: string
  account: Account
  signerManager: SignerManager
}): ReturnType<typeof axios.post<UnitagResponse>> {
  const changeUnitagUrl = `${uniswapUrls.unitagsApiUrl}/username/change`
  const { requestBody, signature } = await createSignedRequestBody<UnitagChangeUsernameRequestBody>(
    {
      username,
      deviceId,
    },
    account,
    signerManager
  )
  const headers = await generateAxiosHeaders(signature)
  return await axios.post<UnitagResponse>(changeUnitagUrl, requestBody, {
    headers,
  })
}
