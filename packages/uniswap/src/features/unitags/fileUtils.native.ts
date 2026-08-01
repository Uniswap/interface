import { File, UploadType } from 'expo-file-system'
import type { S3UploadCredentials } from 'uniswap/src/features/unitags/fileUtils'
import { logger } from 'utilities/src/logger/logger'

// Map file extension to an image MIME type. The S3 upload policy requires a Content-Type starting with "image/".
function getImageMimeType(uri: string): string {
  const extension = uri.split('?')[0]?.split('.').pop()?.toLowerCase()
  switch (extension) {
    case 'png':
      return 'image/png'
    case 'gif':
      return 'image/gif'
    case 'webp':
      return 'image/webp'
    case 'heic':
    case 'heif':
      return 'image/heic'
    default:
      return 'image/jpeg'
  }
}

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

// Native-specific: multipart upload to a pre-signed S3 POST url.
// Uses expo-file-system's native upload — the global fetch (Expo winter runtime) rejects RN's { uri } FormData part.
export async function uploadFileToS3(imageUri: string, creds: S3UploadCredentials): Promise<{ success: boolean }> {
  if (!creds.preSignedUrl || !creds.s3UploadFields) {
    return { success: false }
  }

  const contentType = getImageMimeType(imageUri)
  const parameters = { ...creds.s3UploadFields }
  if (!parameters['Content-Type']) {
    parameters['Content-Type'] = contentType
  }

  try {
    const { status } = await new File(imageUri).upload(creds.preSignedUrl, {
      uploadType: UploadType.MULTIPART,
      fieldName: 'file',
      mimeType: contentType,
      parameters,
    })

    if (status < 200 || status >= 300) {
      throw new Error(`HTTP error! status: ${status}`)
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
