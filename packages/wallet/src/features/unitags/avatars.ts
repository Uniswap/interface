import axios from 'axios'
import { Platform } from 'react-native'
import {
  UnitagAvatarUploadCredentials,
  UnitagGetAvatarUploadUrlResponse,
} from 'uniswap/src/features/unitags/types'
import { logger } from 'utilities/src/logger/logger'
import { getUnitagAvatarUploadUrl, updateUnitagMetadata } from 'wallet/src/features/unitags/api'
import { Account } from 'wallet/src/features/wallet/accounts/types'
import { SignerManager } from 'wallet/src/features/wallet/signing/SignerManager'

export function isLocalFileUri(imageUri: string): boolean {
  const localFilePatterns = [
    'file://', // iOS local file prefix
    'content://', // Android Content Provider
    '/storage/', // Android internal storage (absolute path)
    '/data/', // Android internal data storage (absolute path)
  ]

  // Check if the imageUri starts with any of the local file patterns
  return localFilePatterns.some((pattern) => imageUri.startsWith(pattern))
}

export async function uploadFileToS3(
  imageUri: string,
  creds: UnitagAvatarUploadCredentials
): Promise<{ success: boolean }> {
  if (!creds.preSignedUrl || !creds.s3UploadFields) {
    return { success: false }
  }

  // Standardize the uri for iOS and Android
  const uri = Platform.OS === 'android' ? imageUri : imageUri.replace('file://', '')
  const formData = new FormData()

  // Add the S3 fields to the form data
  Object.entries(creds.s3UploadFields).forEach(([key, value]) => {
    formData.append(key, value)
  })

  // Get the file as a blob to set the Content-Type
  const response = await fetch(uri)
  const blob = await response.blob()
  formData.append('Content-Type', blob.type)

  // Add the file to the form data. We ignore the function signature and input an object with keys uri, type, and name
  // This is the argument that react-native's FormData expects, but for some reason our project thinks it's using typescript's FormData
  // Ignoring the typecheck and forcing the object to be Blob works though
  formData.append('file', {
    uri,
    type: blob.type,
    name: uri,
  } as unknown as Blob)

  // Send the post request to S3 using pre-signed URL and s3 fields
  try {
    await axios.post(creds.preSignedUrl, formData, {
      headers: {
        'Content-Type': 'multipart/form-data', // Important for S3 to process the file correctly
      },
    })
    logger.info('unitags/utils.ts', 'uploadFileToS3', 'Avatar uploaded to S3 successfully')
    return { success: true }
  } catch (error) {
    logger.error(error, {
      tags: { file: 'unitags/utils.ts', function: 'uploadFileToS3' },
    })
    return { success: false }
  }
}

/**
 * Uploads an image to S3 and updates the avatar for a given username and address.
 * Expects imageUri to be a local file, it uploads the file to S3 and updates the avatar URL in the metadata.
 *
 * @param {string} username - The newly claimed unitag.
 * @param {Address} address - The address of the unitag.
 * @param {string} imageUri - The URI of the new avatar image (either a local file or external url).
 * @param {(variables: UnitagUpdateMetadataRequestBody) => Promise<FetchResult<{data: UnitagUpdateMetadataResponse}>>} updateUnitagMetadata - The function to call to update the metadata on the backend.
 * @returns {Promise<boolean>} - A promise that resolves to a boolean indicating whether the avatar was successfully updated.
 */
export async function uploadAndUpdateAvatarAfterClaim({
  username,
  imageUri,
  account,
  signerManager,
}: {
  username: string
  imageUri: string
  account: Account
  signerManager: SignerManager
}): Promise<{ success: boolean }> {
  try {
    // First get pre-signedUrl and s3UploadFields from the backend
    const { data: avatarUploadUrlResponse } = await getUnitagAvatarUploadUrl({
      username,
      account,
      signerManager,
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
    await updateUnitagMetadata({
      username,
      metadata: {
        avatar: avatarUploadUrlResponse.avatarUrl,
      },
      clearAvatar: false,
      account,
      signerManager,
    })
    return { success: true }
  } catch (e) {
    logger.error(e, {
      tags: { file: 'unitags/utils.ts', function: 'uploadAndUpdateAvatarAfterClaim' },
    })
    return { success: false }
  }
}

export const tryUploadAvatar = async ({
  avatarImageUri,
  avatarUploadUrlResponse,
  avatarUploadUrlLoading,
}: {
  avatarImageUri: string | undefined
  avatarUploadUrlResponse: UnitagGetAvatarUploadUrlResponse | undefined
  avatarUploadUrlLoading: boolean
}): Promise<{ success: boolean; skipped: boolean }> => {
  const needsAvatarUpload = !!avatarImageUri && isLocalFileUri(avatarImageUri)
  const isPreSignedUrlReady =
    !avatarUploadUrlLoading &&
    !!avatarUploadUrlResponse?.preSignedUrl &&
    !!avatarUploadUrlResponse?.s3UploadFields
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
