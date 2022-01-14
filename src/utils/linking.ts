import { Linking } from 'react-native'
import { logger } from 'src/utils/logger'

export async function openUri(uri: string) {
  try {
    logger.debug('utils/linking', 'openUri', 'attempting to open URI', uri)
    await Linking.openURL(uri)
  } catch (error) {
    logger.error('utils/linking', 'openUri', 'error opening uri', error)
  }
}
