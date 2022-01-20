import remoteConfig from '@react-native-firebase/remote-config'
import { logger } from 'src/utils/logger'

/**
 * Simple logging util to display enabled experiments.
 * TODO(judo): display experiments on dev screen.
 */
export function printDebugLogs() {
  const values = Object.entries(remoteConfig().getAll())

  logger.info(
    'remoteConfig',
    'initializeRemoteConfig',
    `Remote config fetched and activated (${values.length})`
  )

  values.forEach(([key, entry]) => {
    logger.info(
      'remoteConfig',
      'initializeRemoteConfig',
      `${key} [${entry.getSource()}]: ${entry.asString()}`
    )
  })
}
