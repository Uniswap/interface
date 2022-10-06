import { Amplitude } from '@amplitude/react-native'
import { firebase } from '@react-native-firebase/analytics'
import * as Sentry from '@sentry/react-native'
import { AMPLITUDE_API_KEY } from 'react-native-dotenv'
import { LogContext } from 'src/features/telemetry/constants'
import { logger } from 'src/utils/logger'
type LogTags = {
  [key: string]: Primitive
}

export async function initAnalytics() {
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
    logException(LogContext.Analytics, err)
    logger.error('telemetry', 'enableAnalytics', 'error from Firebase', err)
  }
}

/** Logs a generic event with payload. */
export async function logEvent(name: string, params: {}) {
  if (__DEV__) {
    logger.info('telemetry', 'logEvent', `${name}: ${JSON.stringify(params)}`)
    return
  }

  try {
    await firebase.analytics().logEvent(name, params)
  } catch (err) {
    logger.error('telemetry', 'logEvent', 'error from Firebase', err)
  }
}

/**
 * Logs an exception to our Sentry Dashboard
 *
 * @param context Context from where this method is called
 * @param error Can be the full error object or a custom error message
 * @param extraTags Key/value pairs to enrich logging and allow filtering.
 *                  More info here: https://docs.sentry.io/platforms/react-native/enriching-events/tags/
 */
export function logException(context: LogContext, error: any, extraTags?: LogTags) {
  if (__DEV__) {
    logger.error('telemetry', 'logException', context, error)
    return
  }

  Sentry.captureException(error, { tags: { ...(extraTags || {}), mobileContext: context } })
}

/**
 * Sends a message to our Sentry Dashboard
 *
 * @param context Context from where this method is called
 * @param message Message
 * @param extraTags Key/value pairs to enrich logging and allow filtering.
 *                  More info here: https://docs.sentry.io/platforms/react-native/enriching-events/tags/
 */
export function logMessage(context: LogContext, message: string, extraTags?: LogTags) {
  if (__DEV__) {
    logger.info('telemetry', 'logMessage', context, message)
    return
  }

  Sentry.captureMessage(message, { tags: { ...(extraTags || {}), mobileContext: context } })
}
