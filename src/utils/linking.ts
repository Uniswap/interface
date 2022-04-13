import { Linking } from 'react-native'
import { logger } from 'src/utils/logger'

export async function openUri(uri: string) {
  const supported = await Linking.canOpenURL(uri)
  if (!supported) {
    logger.debug('utils/linking', 'openUri', 'cannot open URI', uri)
    return
  }

  try {
    logger.debug('utils/linking', 'openUri', 'attempting to open URI', uri)
    await Linking.openURL(uri)
  } catch (error) {
    logger.error('utils/linking', 'openUri', 'error opening URI', error)
  }
}

export function openSettings() {
  Linking.openSettings()
}
