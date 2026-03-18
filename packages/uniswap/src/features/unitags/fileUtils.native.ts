import { UnitagAvatarUploadCredentials } from '@universe/api'
import { Platform } from 'react-native'
import { logger } from 'utilities/src/logger/logger'

// Native-specific: React Native file URI patterns
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

// Native-specific: React Native FormData handling
export async function uploadFileToS3(
  imageUri: string,
  creds: UnitagAvatarUploadCredentials,
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
    const postResponse = await fetch(creds.preSignedUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data', // Important for S3 to process the file correctly
      },
      body: formData,
    })

    if (!postResponse.ok) {
      throw new Error(`HTTP error! status: ${postResponse.status}`)
    }

    logger.debug('fileUtils.native.ts', 'uploadFileToS3', 'Avatar uploaded to S3 successfully')
    return { success: true }
  } catch (error) {
    logger.error(error, {
      tags: { file: 'fileUtils.native.ts', function: 'uploadFileToS3' },
    })
    return { success: false }
  }
}
