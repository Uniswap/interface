import * as Clipboard from 'expo-clipboard'
import { logger } from 'src/utils/logger'

export function setClipboard(value: string): void {
  try {
    Clipboard.setString(value)
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
