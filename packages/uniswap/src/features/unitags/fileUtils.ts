import { PlatformSplitStubError } from 'utilities/src/errors'

export type S3UploadCredentials = {
  preSignedUrl?: string
  s3UploadFields?: Record<string, string>
}

export function isLocalFileUri(_imageUri: string): boolean {
  throw new PlatformSplitStubError('isLocalFileUri')
}

export async function uploadFileToS3(_imageUri: string, _creds: S3UploadCredentials): Promise<{ success: boolean }> {
  throw new PlatformSplitStubError('uploadFileToS3')
}
