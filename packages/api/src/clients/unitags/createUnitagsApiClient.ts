import {
  createSignedRequestBody,
  createSignedRequestParams,
  type SignedRequestParams,
} from '@universe/api/src/clients/base/auth'
import { type FetchClient } from '@universe/api/src/clients/base/types'
import { createFetcher } from '@universe/api/src/clients/base/utils'
import {
  type ProfileMetadata,
  type UnitagAddressesRequest,
  type UnitagAddressesResponse,
  type UnitagAddressRequest,
  type UnitagAddressResponse,
  type UnitagChangeUsernameRequestBody,
  type UnitagClaimEligibilityRequest,
  type UnitagClaimEligibilityResponse,
  type UnitagClaimUsernameRequestBody,
  type UnitagDeleteUsernameRequestBody,
  type UnitagGetAvatarUploadUrlResponse,
  type UnitagResponse,
  type UnitagUpdateMetadataRequestBody,
  type UnitagUpdateMetadataResponse,
  type UnitagUsernameRequest,
  type UnitagUsernameResponse,
} from '@universe/api/src/clients/unitags/types'
import { sanitizeAvatarUrl } from 'utilities/src/format/urls'

const UNI_SIG_HEADER_KEY = 'x-uni-sig'

type UnitagsApiClientFetchersContext = {
  fetchClient: FetchClient
}

export type UnitagsApiClientType = {
  fetchUsername: (params: UnitagUsernameRequest) => Promise<UnitagUsernameResponse>
  fetchAddress: (params: UnitagAddressRequest) => Promise<UnitagAddressResponse>
  fetchUnitagsByAddresses: (params: UnitagAddressesRequest) => Promise<UnitagAddressesResponse>
  fetchClaimEligibility: (params: UnitagClaimEligibilityRequest) => Promise<UnitagClaimEligibilityResponse>
  claimUnitag: (params: SignedRequestParams<UnitagClaimUsernameRequestBody>) => Promise<UnitagResponse>
  updateUnitagMetadata: (
    params: { username: string } & SignedRequestParams<UnitagUpdateMetadataRequestBody>,
  ) => Promise<UnitagUpdateMetadataResponse>
  changeUnitag: (params: SignedRequestParams<UnitagChangeUsernameRequestBody>) => Promise<UnitagResponse>
  deleteUnitag: (params: SignedRequestParams<UnitagDeleteUsernameRequestBody>) => Promise<UnitagResponse>
  getUnitagAvatarUploadUrl: (
    params: SignedRequestParams<{ username: string }>,
  ) => Promise<UnitagGetAvatarUploadUrlResponse>
}

export function createUnitagsApiClient(ctx: UnitagsApiClientFetchersContext): UnitagsApiClientType {
  const client = ctx.fetchClient
  const fetchUsername = createFetcher<UnitagUsernameRequest, UnitagUsernameResponse>({
    client,
    method: 'get',
    url: '/username',
    transformResponse: sanitizeMetadataResponse,
  })
  const fetchAddress = createFetcher<UnitagAddressRequest, UnitagAddressResponse>({
    client,
    method: 'get',
    url: '/address',
    transformResponse: sanitizeMetadataResponse,
  })
  const fetchUnitagsByAddresses = createFetcher<UnitagAddressesRequest, UnitagAddressesResponse>({
    client,
    method: 'get',
    url: '/addresses',
    transformResponse: (response) => ({
      ...response,
      usernames: Object.fromEntries(
        Object.entries(response.usernames).map(([address, data]) => [
          address,
          { ...data, metadata: sanitizeProfileMetadata(data.metadata) },
        ]),
      ),
    }),
  })
  const fetchClaimEligibility = createFetcher<UnitagClaimEligibilityRequest, UnitagClaimEligibilityResponse>({
    client,
    method: 'get',
    url: '/claim/eligibility',
  })

  // Post requests with signature authentication
  const claimUnitag = createFetcher<SignedRequestParams<UnitagClaimUsernameRequestBody>, UnitagResponse>({
    client,
    method: 'post',
    url: '/username',
    transformRequest: async (request) => {
      const { data, address, signMessage } = request.params
      const { requestBody, signature } = await createSignedRequestBody<UnitagClaimUsernameRequestBody>({
        data,
        address,
        signMessage,
      })
      return {
        params: requestBody,
        headers: {
          [UNI_SIG_HEADER_KEY]: signature,
        },
      }
    },
  })
  const updateUnitagMetadata = createFetcher<
    { username: string } & SignedRequestParams<UnitagUpdateMetadataRequestBody>,
    UnitagUpdateMetadataResponse
  >({
    client,
    method: 'put',
    url: '/username/:username/metadata',
    transformRequest: async (request) => {
      const { data, address, signMessage } = request.params
      const { requestBody, signature } = await createSignedRequestBody<UnitagUpdateMetadataRequestBody>({
        data,
        address,
        signMessage,
      })
      return {
        url: request.url.replace(':username', request.params.username),
        params: requestBody,
        headers: {
          [UNI_SIG_HEADER_KEY]: signature,
        },
      }
    },
    transformResponse: sanitizeMetadataResponse,
  })
  const changeUnitag = createFetcher<SignedRequestParams<UnitagChangeUsernameRequestBody>, UnitagResponse>({
    client,
    method: 'post',
    url: '/username/change',
    transformRequest: async (request) => {
      const { data, address, signMessage } = request.params
      const { requestBody, signature } = await createSignedRequestBody<UnitagChangeUsernameRequestBody>({
        data,
        address,
        signMessage,
      })
      return {
        params: requestBody,
        headers: {
          [UNI_SIG_HEADER_KEY]: signature,
        },
      }
    },
  })
  const deleteUnitag = createFetcher<SignedRequestParams<UnitagDeleteUsernameRequestBody>, UnitagResponse>({
    client,
    method: 'delete',
    url: '/username',
    transformRequest: async (request) => {
      const { data, address, signMessage } = request.params
      const { requestBody, signature } = await createSignedRequestBody<UnitagDeleteUsernameRequestBody>({
        data,
        address,
        signMessage,
      })
      return {
        params: requestBody,
        headers: {
          [UNI_SIG_HEADER_KEY]: signature,
        },
      }
    },
  })
  const getUnitagAvatarUploadUrl = createFetcher<
    SignedRequestParams<{ username: string }>,
    UnitagGetAvatarUploadUrlResponse
  >({
    client,
    method: 'get',
    url: '/username/avatar-upload-url',
    transformRequest: async (request) => {
      const { data, address, signMessage } = request.params
      const { requestParams, signature } = await createSignedRequestParams<{ username: string }>({
        data,
        address,
        signMessage,
      })
      return {
        params: requestParams,
        headers: {
          [UNI_SIG_HEADER_KEY]: signature,
        },
      }
    },
  })

  return {
    fetchUsername,
    fetchAddress,
    fetchUnitagsByAddresses,
    fetchClaimEligibility,
    claimUnitag,
    updateUnitagMetadata,
    changeUnitag,
    deleteUnitag,
    getUnitagAvatarUploadUrl,
  }
}

function sanitizeProfileMetadata(metadata: ProfileMetadata | undefined): ProfileMetadata | undefined {
  if (!metadata) {
    return metadata
  }
  return {
    ...metadata,
    avatar: sanitizeAvatarUrl(metadata.avatar ?? null) ?? undefined,
  }
}

function sanitizeMetadataResponse<T extends { metadata?: ProfileMetadata }>(response: T): T {
  return { ...response, metadata: sanitizeProfileMetadata(response.metadata) }
}
