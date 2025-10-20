import { UnitagAvatarUploadCredentials } from '@universe/api'
import { logger } from 'utilities/src/logger/logger'

// Web-specific: data URLs and blob URLs as local files
export function isLocalFileUri(imageUri: string): boolean {
  if (!imageUri) {
    return false
  }

  const localFilePatterns = ['data:', 'blob:']
  return localFilePatterns.some((pattern) => imageUri.startsWith(pattern))
}

// Convert data URL to blob
function dataURLToBlob(dataURL: string): Blob {
  const arr = dataURL.split(',')
  if (arr.length !== 2 || !arr[0] || !arr[1]) {
    throw new Error('Invalid data URL format')
  }

  const header = arr[0]
  const data = arr[1]

  const mimeMatch = header.match(/:(.*?);/)
  if (!mimeMatch || mimeMatch.length < 2 || !mimeMatch[1]) {
    throw new Error('Could not extract MIME type from data URL')
  }

  const mime = mimeMatch[1]
  const bstr = atob(data)
  let n = bstr.length
  const u8arr = new Uint8Array(n)

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }

  return new Blob([u8arr], { type: mime })
}

// Web-specific: Convert data URLs to blobs for upload
export async function uploadFileToS3(
  imageUri: string,
  creds: UnitagAvatarUploadCredentials,
): Promise<{ success: boolean }> {
  if (!creds.preSignedUrl || !creds.s3UploadFields) {
    return { success: false }
  }

  try {
    let blob: Blob
    // Handle blob URLs
    if (imageUri.startsWith('blob:')) {
      const response = await fetch(imageUri)
      blob = await response.blob()
    } else {
      // Convert data URL to blob
      blob = dataURLToBlob(imageUri)
    }

    const formData = new FormData()

    // Add the S3 fields to the form data
    Object.entries(creds.s3UploadFields).forEach(([key, value]) => {
      formData.append(key, value)
    })

    // Add the file to the form data
    formData.append('file', blob)

    // Send the post request to S3 using pre-signed URL and s3 fields
    const postResponse = await fetch(creds.preSignedUrl, {
      method: 'POST',
      body: formData,
    })

    if (!postResponse.ok) {
      throw new Error(`HTTP error! status: ${postResponse.status}`)
    }

    logger.debug('fileUtils.web.ts', 'uploadFileToS3', 'Avatar uploaded to S3 successfully')
    return { success: true }
  } catch (error) {
    logger.error(error, {
      tags: { file: 'fileUtils.web.ts', function: 'uploadFileToS3' },
    })
    return { success: false }
  }
}
