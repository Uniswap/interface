import { PlainMessage, toPlainMessage } from '@bufbuild/protobuf'
import type { CallOptions, PromiseClient } from '@connectrpc/connect'
import { UnitagService } from '@uniswap/client-unitag/dist/uniswap/unitag/v1/UnitagService_connect'
import {
  AvatarUploadRequest,
  AvatarUploadResponse,
  CanClaimUsernameRequest,
  CanClaimUsernameResponse,
  ChangeUsernameRequest,
  ClaimUsernameRequest,
  GetAddressRequest,
  GetAddressResponse,
  GetAddressesRequest,
  GetAddressesResponse,
  GetUsernameRequest,
  GetUsernameResponse,
  ProfileMetadata,
  RemoveUsernameRequest,
  SuccessResponse,
  UpdateProfileMetadataRequest,
  UpdateProfileMetadataResponse,
} from '@uniswap/client-unitag/dist/uniswap/unitag/v1/UnitagService_pb'
import {
  signUnitagServiceMessage,
  SignedRequestParams,
  NEW_UNITAGS_SIGNATURE_HEADER,
} from '@universe/api/src/clients/base/auth'
import { sanitizeAvatarUrl } from 'utilities/src/format/urls'

export interface UnitagsServiceApiClientContext {
  rpcClient: PromiseClient<typeof UnitagService>
}

/**
 * ConnectRPC facade for Unitags. Method names mirror gRPC RPCs (camelCase).
 * Avatar URLs in profile metadata are sanitized the same way as {@link createUnitagsApiClient}.
 */
export interface UnitagsServiceApiClient {
  fetchUsername: (params: PlainMessage<GetUsernameRequest>) => Promise<GetUsernameResponse>
  fetchClaimEligibility: (params: PlainMessage<CanClaimUsernameRequest>) => Promise<CanClaimUsernameResponse>
  fetchAddress: (params: PlainMessage<GetAddressRequest>) => Promise<GetAddressResponse>
  fetchUnitagsByAddresses: (params: PlainMessage<GetAddressesRequest>) => Promise<GetAddressesResponse>
  claimUnitag: (params: SignedRequestParams<PlainMessage<ClaimUsernameRequest>>) => Promise<SuccessResponse>
  changeUnitag: (params: SignedRequestParams<PlainMessage<ChangeUsernameRequest>>) => Promise<SuccessResponse>
  deleteUnitag: (params: SignedRequestParams<PlainMessage<RemoveUsernameRequest>>) => Promise<SuccessResponse>
  getUnitagAvatarUploadUrl: (
    params: SignedRequestParams<PlainMessage<AvatarUploadRequest>>,
  ) => Promise<AvatarUploadResponse>
  updateUnitagMetadata: (
    params: SignedRequestParams<PlainMessage<UpdateProfileMetadataRequest>>,
  ) => Promise<UpdateProfileMetadataResponse>
}

export function createUnitagServiceApiClient({ rpcClient }: UnitagsServiceApiClientContext): UnitagsServiceApiClient {
  return {
    fetchUsername: async (params) => sanitizeAvatarUrlInResponse(await rpcClient.getUsername(params)),
    fetchClaimEligibility: (params) => rpcClient.canClaimUsername(params),
    fetchAddress: async (params) => sanitizeAvatarUrlInResponse(await rpcClient.getAddress(params)),
    fetchUnitagsByAddresses: async (params) => sanitizeAvatarUrlsInResponse(await rpcClient.getAddresses(params)),
    claimUnitag: async (params) => {
      const { data, signature } = await signUnitagServiceMessage(params)
      return rpcClient.claimUsername(data, makeSignatureHeaderOptions(signature))
    },
    changeUnitag: async (params) => {
      const { data, signature } = await signUnitagServiceMessage(params)
      return rpcClient.changeUsername(data, makeSignatureHeaderOptions(signature))
    },
    deleteUnitag: async (params) => {
      const { data, signature } = await signUnitagServiceMessage(params)
      return rpcClient.removeUsername(data, makeSignatureHeaderOptions(signature))
    },
    getUnitagAvatarUploadUrl: async (params) => {
      const { data, signature } = await signUnitagServiceMessage(params)
      return rpcClient.avatarUpload(data, makeSignatureHeaderOptions(signature))
    },
    updateUnitagMetadata: async (params) => {
      const { data, signature } = await signUnitagServiceMessage(params)
      return sanitizeAvatarUrlInResponse(
        await rpcClient.updateProfileMetadata(data, makeSignatureHeaderOptions(signature)),
      )
    },
  }
}

function makeSignatureHeaderOptions(signature: string): CallOptions {
  return { headers: { [NEW_UNITAGS_SIGNATURE_HEADER]: signature } }
}

function sanitizeAvatarUrlInResponse<T extends { metadata?: ProfileMetadata }>(response: T): T {
  if (!response.metadata) {
    return response
  }

  return {
    ...response,
    metadata: {
      // oxlint-disable-next-line typescript-eslint/no-misused-spread
      ...response.metadata,
      // oxlint-disable-next-line typescript-eslint/no-unnecessary-condition
      avatar: sanitizeAvatarUrl(response.metadata?.avatar ?? null) ?? undefined,
    },
  }
}

function sanitizeAvatarUrlsInResponse(response: GetAddressesResponse): GetAddressesResponse {
  const plain = toPlainMessage(response)
  const usernames: { [key: string]: GetAddressResponse } = {}
  for (const [addr, data] of Object.entries(plain.usernames)) {
    usernames[addr] = sanitizeAvatarUrlInResponse(new GetAddressResponse(data))
  }
  return new GetAddressesResponse({ usernames })
}
