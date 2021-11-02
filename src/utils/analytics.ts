import { firebase } from '@react-native-firebase/analytics'
import { logger } from 'src/utils/logger'

export async function enableAnalytics() {
  await firebase.analytics().setAnalyticsCollectionEnabled(true)
}

export async function logEvent(name: string, params: {}) {
  try {
    await firebase.analytics().logEvent(name, params)
  } catch (err) {
    logger.error('analytics', 'logEvent', 'error from firebase', err)
  }
}
