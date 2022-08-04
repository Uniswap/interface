import { Amplitude } from '@amplitude/react-native'
import { firebase } from '@react-native-firebase/analytics'
import { AMPLITUDE_API_KEY } from 'react-native-dotenv'
import { logger } from 'src/utils/logger'

export async function enableAnalytics() {
  if (__DEV__) {
    // avoid polluting analytics dashboards with dev data
    // consider re-enabling if validating data prior to launches is useful
    return
  }

  try {
    const ampInstance = Amplitude.getInstance()
    ampInstance.init(AMPLITUDE_API_KEY)

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
