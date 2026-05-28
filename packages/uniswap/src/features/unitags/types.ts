// Internal types

export type UnitagClaim = {
  address?: string
  username: string
  avatarUri?: string
}

export type UnitagClaimSource = 'onboarding' | 'home' | 'settings'

export type UnitagClaimContext = {
  source: UnitagClaimSource
  hasENSAddress: boolean
}

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

export type UnitagAvatarUploadCredentials = {
  preSignedUrl?: string
  s3UploadFields?: Record<string, string>
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
