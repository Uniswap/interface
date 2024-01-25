import * as ExpoClipboard from 'expo-clipboard'
import { logger } from 'utilities/src/logger/logger'
import { IClipboard } from 'wallet/src/utils/clipboard'

const Clipboard: IClipboard = {
  setClipboard: async (value: string) => {
    try {
      await ExpoClipboard.setStringAsync(value)
    } catch (error) {
      logger.error(error, { tags: { file: 'clipboard', function: 'setClipboard' } })
    }
  },
  getClipboard: async () => {
    try {
      const value = await ExpoClipboard.getStringAsync()
      return value
    } catch (error) {
      logger.error(error, { tags: { file: 'clipboard', function: 'getClipboard' } })
    }
  },
  setClipboardImage: async (imageUrl: string | undefined) => {
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
        await ExpoClipboard.setImageAsync(formattedEncoding)
      }
    } catch (error) {
      logger.error(error, {
        tags: { file: 'clipboard', function: 'setClipboardImage' },
        extra: { imageUrl },
      })
    }
  },
} as IClipboard

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

export function setClipboard(value: string): Promise<void> {
  return Clipboard.setClipboard(value)
}

export function getClipboard(): Promise<string | void> {
  return Clipboard.getClipboard()
}

export function setClipboardImage(imageUrl: string | undefined): Promise<void> {
  return Clipboard.setClipboardImage(imageUrl)
}
