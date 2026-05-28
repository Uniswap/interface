import { ImageLibraryOptions, launchImageLibrary } from 'react-native-image-picker'
import { AVATAR_IMAGE_STANDARDS } from 'wallet/src/features/unitags/imageConstants'

// Selected image will be shrunk to max width/height
// URI will then be for an image of those dimensions
const IMAGE_OPTIONS: ImageLibraryOptions = {
  mediaType: 'photo',
  maxWidth: AVATAR_IMAGE_STANDARDS.maxWidth,
  maxHeight: AVATAR_IMAGE_STANDARDS.maxHeight,
  quality: AVATAR_IMAGE_STANDARDS.quality,
  includeBase64: false,
  selectionLimit: 1,
}

export async function selectPhotoFromLibrary(): Promise<string | undefined> {
  const response = await launchImageLibrary(IMAGE_OPTIONS)
  if (!response.didCancel && !response.errorCode && response.assets) {
    return response.assets[0]?.uri
  }
  return undefined
}
