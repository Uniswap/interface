import { flush, Identify, identify, init, track } from '@amplitude/analytics-react-native'
import { firebase } from '@react-native-firebase/analytics'
import * as Sentry from '@sentry/react-native'
import { uniswapUrls } from 'src/constants/urls'
import { ApplicationTransport } from 'src/features/telemetry/ApplicationTransport'
import { LogContext, UserPropertyName } from 'src/features/telemetry/constants'
import { EventProperties } from 'src/features/telemetry/types'
import { logger } from 'src/utils/logger'
type LogTags = {
  [key: string]: Primitive
}

const DUMMY_KEY = '00000000000000000000000000000000'

export async function initAnalytics() {
  if (__DEV__) {
    // avoid polluting analytics dashboards with dev data
    // consider re-enabling if validating data prior to launches is useful
    return
  }

  try {
    init(
      // reporting to test project until we add the proxy in a comming PR
      DUMMY_KEY,
      undefined, // User ID should be undefined to let Amplitude default to Device ID
      {
        transportProvider: new ApplicationTransport(uniswapUrls.amplitudeProxyUrl), // Used to support custom reverse proxy header
        // Disable tracking of private user information by Amplitude
        trackingOptions: {
          adid: false,
          country: false,
          carrier: false,
          city: false,
          dma: false, // designated market area
          ipAddress: false,
          region: false,
        },
      }
    )
    await firebase.analytics().setAnalyticsCollectionEnabled(true)
  } catch (err) {
    logException(LogContext.Analytics, err)
    logger.error('telemetry', 'enableAnalytics', 'error initializing analytics', err)
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

//#region ------------------------------ Sentry ------------------------------

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

//#endregion

//#region ------------------------------ Amplitude ------------------------------

/**
 * Sends an event to Amplitude.
 */
export function sendAnalyticsEvent<EventName extends keyof EventProperties>(
  ...args: undefined extends EventProperties[EventName]
    ? [EventName] | [EventName, EventProperties[EventName]]
    : [EventName, EventProperties[EventName]]
) {
  const [eventName, eventProperties] = args
  if (__DEV__) {
    logger.info(
      'telemetry',
      'sendAnalyticsEvent',
      `[analytics(${eventName})]: ${JSON.stringify(eventProperties)}`
    )
    return
  }

  track(eventName, eventProperties)
}

export function flushAnalyticsEvents() {
  if (__DEV__) {
    logger.info('telemetry', 'flushAnalyticsEvents', 'flushing analytics events')
    return
  }
  flush()
}

// didn't want to set it to Amplitude's type to keep it loose from their implementation
type ValidPropertyValue = number | string | boolean | Array<string | number>

export function setUserProperty(property: UserPropertyName, value: ValidPropertyValue) {
  if (__DEV__) {
    logger.info('telemetry', 'setUserProperty', `property: ${property}, value: ${value}`)
    return
  }
  identify(new Identify().set(property, value))
}

//#endregion
