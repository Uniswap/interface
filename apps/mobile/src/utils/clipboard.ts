import * as Clipboard from 'expo-clipboard'
import { logger } from 'utilities/src/logger/logger'

export async function setClipboard(value: string): Promise<void> {
  try {
    await Clipboard.setStringAsync(value)
  } catch (error) {
    logger.error(error, { tags: { file: 'clipboard', function: 'setClipboard' } })
  }
}

export async function getClipboard(): Promise<string | void> {
  try {
    const value = await Clipboard.getStringAsync()
    return value
  } catch (error) {
    logger.error(error, { tags: { file: 'clipboard', function: 'getClipboard' } })
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
      await Clipboard.setImageAsync(formattedEncoding)
    }
  } catch (error) {
    logger.error(error, {
      tags: { file: 'clipboard', function: 'setClipboardImage' },
      extra: { imageUrl },
    })
  }
}

// Convert image data blob to base64 encoding
function blobToBase64(blob: Blob): Promise<ArrayBuffer | string | null> {
  const reader = new FileReader()
  reader.readAsDataURL(blob)
  return new Promise((resolve) => {
    reader.onloadend = (): void => {
      resolve(reader.result)
    }
  })
}
