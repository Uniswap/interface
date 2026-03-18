import { UnitagAvatarUploadCredentials } from '@universe/api'
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
