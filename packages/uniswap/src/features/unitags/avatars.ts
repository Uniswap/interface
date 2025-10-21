import { SignMessageFunc } from 'uniswap/src/data/utils'
import { UnitagAvatarUploadCredentials, UnitagGetAvatarUploadUrlResponse } from 'uniswap/src/features/unitags/types'
import { PlatformSplitStubError } from 'utilities/src/errors'

export function isLocalFileUri(_imageUri: string): boolean {
  throw new PlatformSplitStubError('isLocalFileUri')
}

export async function uploadFileToS3(
  _imageUri: string,
  _creds: UnitagAvatarUploadCredentials,
): Promise<{ success: boolean }> {
  throw new PlatformSplitStubError('uploadFileToS3')
}

export async function uploadAndUpdateAvatarAfterClaim(_params: {
  username: string
  imageUri: string
  address: string
  signMessage: SignMessageFunc
}): Promise<{ success: boolean }> {
  throw new PlatformSplitStubError('uploadAndUpdateAvatarAfterClaim')
}

export async function tryUploadAvatar(_params: {
  avatarImageUri: string | undefined
  avatarUploadUrlResponse: UnitagGetAvatarUploadUrlResponse | undefined
  avatarUploadUrlLoading: boolean
}): Promise<{ success: boolean; skipped: boolean }> {
  throw new PlatformSplitStubError('tryUploadAvatar')
}
