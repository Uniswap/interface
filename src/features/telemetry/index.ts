import { firebase } from '@react-native-firebase/analytics'
import { logger } from 'src/utils/logger'

export async function enableAnalytics() {
  try {
    await firebase.analytics().setAnalyticsCollectionEnabled(true)
  } catch (err) {
    logger.error('telemetry', 'enableAnalytics', 'error from Firebase', err)
  }
}

/** Logs a generic event with payload. */
export async function logEvent(name: string, params: {}) {
  if (__DEV__) {
    logger.info('telemetry', 'logEvent', `${name}: ${JSON.stringify(params)}`)
  }

  try {
    await firebase.analytics().logEvent(name, params)
  } catch (err) {
    logger.error('telemetry', 'logEvent', 'error from Firebase', err)
  }
}

/** Logs a screen view event. */
export async function logScreenView(name: string) {
  if (__DEV__) {
    logger.info('telemetry', 'logScreenView', name)
  }

  try {
    await firebase.analytics().logScreenView({ screen_name: name })
  } catch (err) {
    logger.error('telemetry', 'logScreenView', 'error from Firebase', err)
  }
}
