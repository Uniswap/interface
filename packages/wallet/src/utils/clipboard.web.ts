import { logger } from 'utilities/src/logger/logger'
import { IClipboard } from 'wallet/src/utils/clipboard'

const Clipboard: IClipboard = {
  setClipboard: async (value: string) => {
    await navigator.clipboard.writeText(value)
  },
  getClipboard: async () => {
    const value = await navigator.clipboard.readText()
    return value
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setClipboardImage: async (imageUrl: string | undefined) => {
    throw new Error('setClipboardImage not implemented on web')
  },
} as IClipboard

export async function setClipboard(value: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(value)
  } catch (error) {
    logger.error(error, { tags: { file: 'clipboard', function: 'setClipboard' } })
  }
}

export async function getClipboard(): Promise<string | void> {
  return Clipboard.getClipboard()
}

export async function setClipboardImage(imageUrl: string | undefined): Promise<void> {
  return Clipboard.setClipboardImage(imageUrl)
}
