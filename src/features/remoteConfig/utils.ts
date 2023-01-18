import remoteConfig from '@react-native-firebase/remote-config'
import { logger } from 'src/utils/logger'

/**
 * Simple logging util to display enabled experiments.
 * TODO: [MOB-3896] display experiments on dev screen.
 */
export function printDebugLogs(): void {
  const values = Object.entries(remoteConfig().getAll())

  logger.debug(
    'remoteConfig',
    'initializeRemoteConfig',
    `Remote config fetched and activated (${values.length})`
  )

  values.forEach(([key, entry]) => {
    logger.debug(
      'remoteConfig',
      'initializeRemoteConfig',
      `${key} [${entry.getSource()}]: ${entry.asString()}`
    )
  })
}
