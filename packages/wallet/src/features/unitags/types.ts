export type UnitagUsernameResponse = {
  available: boolean
  requiresEnsMatch: boolean
  metadata?: ProfileMetadata
  address?: {
    address: Address
  }
}

export type UnitagAddressResponse = {
  username?: string
  metadata?: ProfileMetadata
}

export type UnitagClaimResponse = {
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
  url?: string
  twitter?: string
}

export type UnitagClaimUsernameRequestBody = {
  address: Address
  username: string
  deviceId: string
  metadata?: ProfileMetadata
}

export type UnitagClaimEligibilityParams = {
  address?: Address
  deviceId: string
}

export type UnitagUpdateMetadataRequestBody = {
  address: Address
  metadata: ProfileMetadata
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

export type UnitagAvatarUploadCredentials = {
  preSignedUrl?: string
  s3UploadFields?: Record<string, string>
}

// Copied enum from unitags backend code -- needs to be up-to-date
export enum UnitagErrorCodes {
  UnitagNotAvailable = 'unitags-1',
  RequiresENSMatch = 'unitags-2',
  IPLimitReached = 'unitags-3',
  AddressLimitReached = 'unitags-4',
  DeviceLimitReached = 'unitags-5',
  ExistingUnitagForDevice = 'unitags-6',
  ExistingUnitagForAddress = 'unitags-7',
  NoUnitagForAddress = 'unitags-8',
  UnitagNotActive = 'unitags-9',
}
