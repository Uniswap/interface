import { AVATAR_IMAGE_STANDARDS } from 'wallet/src/features/unitags/imageConstants'

// Resize image to meet avatar standards
function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = (): void => {
      // Calculate dimensions maintaining aspect ratio
      const { maxWidth, maxHeight } = AVATAR_IMAGE_STANDARDS
      let { width, height } = img

      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }
      }

      canvas.width = width
      canvas.height = height

      if (!ctx) {
        reject(new Error('Could not get canvas context'))
        return
      }

      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob): void => {
          if (!blob) {
            reject(new Error('Could not convert canvas to blob'))
            return
          }

          const reader = new FileReader()
          reader.onload = (): void => resolve(reader.result as string)
          reader.onerror = (): void => reject(new Error('Could not read resized image'))
          reader.readAsDataURL(blob)
        },
        file.type,
        AVATAR_IMAGE_STANDARDS.quality,
      )
    }

    img.onerror = (): void => reject(new Error('Could not load image'))
    img.src = URL.createObjectURL(file)
  })
}

// Web-compatible image selection with validation and resizing
export async function selectPhotoFromLibrary(): Promise<string | undefined> {
  return new Promise((resolve): void => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = AVATAR_IMAGE_STANDARDS.allowedTypes.join(',')

    input.onchange = async (event: Event): Promise<void> => {
      try {
        const target = event.target as HTMLInputElement
        const file = target.files?.[0]

        if (!file) {
          resolve(undefined)
          return
        }

        // Validate file type
        if (!AVATAR_IMAGE_STANDARDS.allowedTypes.some((type: string): boolean => type === file.type)) {
          resolve(undefined)
          return
        }

        // Validate file size
        if (file.size > AVATAR_IMAGE_STANDARDS.maxFileSizeBytes) {
          resolve(undefined)
          return
        }

        // Resize image to meet standards
        const resizedImageDataUrl = await resizeImage(file)
        resolve(resizedImageDataUrl)
      } catch (_error) {
        // On any error, just return undefined (user can try again)
        resolve(undefined)
      }
    }

    input.oncancel = (): void => {
      resolve(undefined)
    }

    // Trigger the file picker
    input.click()
  })
}
