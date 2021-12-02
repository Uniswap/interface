import * as Clipboard from 'expo-clipboard'
import { logger } from 'src/utils/logger'

export function setClipboard(value: string) {
  try {
    Clipboard.setString(value)
  } catch (error) {
    // TODO consider re-throwing here or showing generic error
    logger.error('clipboard', 'setClipboard', 'Unable to set clipboard string', error)
  }
}

export async function getClipboard() {
  try {
    const value = await Clipboard.getStringAsync()
    return value
  } catch (error) {
    // TODO consider re-throwing here or showing generic error
    logger.error('clipboard', 'getClipboard', 'Unable to get clipboard string', error)
  }
}
