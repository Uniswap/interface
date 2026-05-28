import { AvatarUploadResponse, SignMessageFunc, UnitagsServiceApiClient } from '@universe/api'
import { isLocalFileUri, uploadFileToS3 } from 'uniswap/src/features/unitags/fileUtils'
import { logger } from 'utilities/src/logger/logger'

export async function uploadAndUpdateAvatarAfterClaim({
  unitagsApiClient,
  username,
  imageUri,
  address,
  signMessage,
}: {
  unitagsApiClient: UnitagsServiceApiClient
  username: string
  imageUri: string
  address: string
  signMessage: SignMessageFunc
}): Promise<{ success: boolean }> {
  try {
    // First get pre-signedUrl and s3UploadFields from the backend
    const avatarUploadUrlResponse = await unitagsApiClient.getUnitagAvatarUploadUrl({
      data: { username },
      address,
      signMessage,
    })

    // Then upload to S3
    const { success: uploadSuccess } = await uploadFileToS3(imageUri, {
      preSignedUrl: avatarUploadUrlResponse.preSignedUrl,
      s3UploadFields: avatarUploadUrlResponse.s3UploadFields,
    })

    // Check if upload succeeded
    if (!uploadSuccess) {
      return { success: false }
    }

    // Then update profile metadata with the image url
    await unitagsApiClient.updateUnitagMetadata({
      data: {
        username,
        metadata: {
          avatar: avatarUploadUrlResponse.avatarUrl,
        },
        clearAvatar: false,
      },
      address,
      signMessage,
    })
    return { success: true }
  } catch (e) {
    logger.error(e, {
      tags: { file: 'unitags/avatars.ts', function: 'uploadAndUpdateAvatarAfterClaim' },
    })
    return { success: false }
  }
}

export async function tryUploadAvatar({
  avatarImageUri,
  avatarUploadUrlResponse,
  avatarUploadUrlLoading,
}: {
  avatarImageUri: string | undefined
  avatarUploadUrlResponse: AvatarUploadResponse | undefined
  avatarUploadUrlLoading: boolean
}): Promise<{ success: boolean; skipped: boolean }> {
  const needsAvatarUpload = !!avatarImageUri && isLocalFileUri(avatarImageUri)
  const isPreSignedUrlReady =
    !avatarUploadUrlLoading && !!avatarUploadUrlResponse?.preSignedUrl && !!avatarUploadUrlResponse.s3UploadFields
  const shouldTryAvatarUpload = needsAvatarUpload && isPreSignedUrlReady

  if (!shouldTryAvatarUpload) {
    // Return success=true if no upload needed, false if upload needed but can't make request
    return { success: !needsAvatarUpload, skipped: true }
  }

  const avatarUploadResult = await uploadFileToS3(avatarImageUri, {
    preSignedUrl: avatarUploadUrlResponse.preSignedUrl,
    s3UploadFields: avatarUploadUrlResponse.s3UploadFields,
  })

  return { ...avatarUploadResult, skipped: false }
}
