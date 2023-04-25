import * as Clipboard from 'expo-clipboard'
import { logger } from 'src/utils/logger'

export function setClipboard(value: string): void {
  try {
    Clipboard.setStringAsync(value)
  } catch (error) {
    logger.error('clipboard', 'setClipboard', 'Unable to set clipboard string', error)
  }
}

export async function getClipboard(): Promise<string | void> {
  try {
    const value = await Clipboard.getStringAsync()
    return value
  } catch (error) {
    logger.error('clipboard', 'getClipboard', 'Unable to get clipboard string', error)
  }
}

export async function setClipboardImage(imageUrl: string | undefined): Promise<void> {
  if (!imageUrl) {
    return
  }

  try {
    // fetch image blob from remote source
    const res = await fetch(imageUrl)
    const blob = await res.blob()

    // convert to base64 required for clipboard
    const base64Encoding = await blobToBase64(blob)

    // extract base64 encoding from result string
    const formattedEncoding =
      typeof base64Encoding === 'string' ? base64Encoding.split(',')[1] : null

    // if valid result, copy to clipboard
    if (formattedEncoding) {
      Clipboard.setImageAsync(formattedEncoding)
    }
  } catch (e) {
    logger.error(
      'clipboard',
      'setClipboardImage',
      `Unable to set clipboard image url: ${imageUrl}`,
      e
    )
  }
}

// Convert image data blob to base64 encoding
function blobToBase64(blob: Blob): Promise<ArrayBuffer | string> {
  const reader = new FileReader()
  reader.readAsDataURL(blob)
  return new Promise((resolve) => {
    reader.onloadend = (): void => {
      resolve(reader.result)
    }
  })
}
