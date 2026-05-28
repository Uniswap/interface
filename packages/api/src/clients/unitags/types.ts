import { UnitagErrorCode } from '@uniswap/client-unitag/dist/uniswap/unitag/v1/UnitagService_pb'

// API types
export type UnitagUsernameRequest = {
  username: string
}

export type UnitagUsernameResponse = {
  available: boolean
  requiresEnsMatch: boolean
  metadata?: ProfileMetadata
  username?: string
  address?: {
    address: Address
  }
}

export type UnitagAddressRequest = {
  address: string
}

export type UnitagAddressResponse = {
  username?: string
  address?: Address
  metadata?: ProfileMetadata
}

export type UnitagAddressesRequest = {
  addresses: Address[]
}

export type UnitagAddressesResponse = {
  usernames: {
    [address: Address]: UnitagAddressResponse
  }
}

export type UnitagResponse = {
  success: boolean
  errorCode?: UnitagErrorCodes
}

export type UnitagClaimEligibilityResponse = {
  canClaim: boolean
  errorCode?: UnitagErrorCodes
}

export type ProfileMetadata = {
  avatar?: string
  description?: string
  twitter?: string
}

export type UnitagClaimUsernameRequestBody = {
  username: string
  deviceId: string
  metadata?: ProfileMetadata
}

export type UnitagClaimEligibilityRequest = {
  address?: Address
  deviceId: string
  isUsernameChange?: boolean
}

export type UnitagUpdateMetadataRequestBody = {
  username: string
  metadata: ProfileMetadata
  clearAvatar?: boolean
}

export type UnitagUpdateMetadataResponse = {
  success: boolean
  metadata?: ProfileMetadata
}

export type UnitagGetAvatarUploadUrlResponse = {
  success: boolean
  avatarUrl?: string
  preSignedUrl?: string
  s3UploadFields?: Record<string, string>
}

export type UnitagDeleteUsernameRequestBody = {
  username: string
}

export type UnitagChangeUsernameRequestBody = {
  username: string
  deviceId: string
}

// Copied enum from unitags backend code -- needs to be up-to-date
export enum UnitagErrorCodes {
  UnitagNotAvailable = 'unitags-1',
  RequiresENSMatch = 'unitags-2',
  IPLimitReached = 'unitags-3',
  AddressLimitReached = 'unitags-4',
  DeviceLimitReached = 'unitags-5',
  DeviceActiveLimitReached = 'unitags-6',
  AddressActiveLimitReached = 'unitags-7',
  NoUnitagForAddress = 'unitags-8',
  UnitagNotActive = 'unitags-9',
}

export function isOldErrorCode(errorCode: UnitagErrorCodes | UnitagErrorCode): errorCode is UnitagErrorCodes {
  return typeof errorCode === 'string' && Object.values(UnitagErrorCodes).includes(errorCode as UnitagErrorCodes)
}

// oxlint-disable-next-line typescript-eslint/consistent-return
export function ensureNewErrorCode(errorCode: UnitagErrorCodes | UnitagErrorCode): UnitagErrorCode {
  if (!isOldErrorCode(errorCode)) {
    return errorCode
  }

  switch (errorCode) {
    case UnitagErrorCodes.UnitagNotAvailable:
      return UnitagErrorCode.UNITAG_ERROR_NOT_AVAILABLE
    case UnitagErrorCodes.RequiresENSMatch:
      return UnitagErrorCode.UNITAG_ERROR_REQUIRES_ENS_MATCH
    case UnitagErrorCodes.IPLimitReached:
      return UnitagErrorCode.UNITAG_ERROR_IP_LIMIT_REACHED
    case UnitagErrorCodes.AddressLimitReached:
      return UnitagErrorCode.UNITAG_ERROR_ADDRESS_LIMIT_REACHED
    case UnitagErrorCodes.DeviceLimitReached:
      return UnitagErrorCode.UNITAG_ERROR_DEVICE_LIMIT_REACHED
    case UnitagErrorCodes.DeviceActiveLimitReached:
      return UnitagErrorCode.UNITAG_ERROR_DEVICE_ACTIVE_LIMIT
    case UnitagErrorCodes.AddressActiveLimitReached:
      return UnitagErrorCode.UNITAG_ERROR_ADDRESS_ACTIVE_LIMIT
    case UnitagErrorCodes.NoUnitagForAddress:
      return UnitagErrorCode.UNITAG_ERROR_NO_UNITAG_FOR_ADDRESS
    case UnitagErrorCodes.UnitagNotActive:
      return UnitagErrorCode.UNITAG_ERROR_NOT_ACTIVE
  }
}
