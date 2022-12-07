import { flush, Identify, identify, init, track } from '@amplitude/analytics-react-native'
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
  } catch (err) {
    logger.error('telemetry/index', 'initiAnalytics', `${err}`)
  }
}

/** Logs a generic event with payload. */
export async function logEvent(name: string, params: Record<string, unknown>) {
  if (__DEV__) {
    logger.info('telemetry', 'logEvent', `${name}: ${JSON.stringify(params)}`)
    return
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
export function logException(context: string, error: unknown, extraTags?: LogTags) {
  if (__DEV__) {
    // should already be logged by logger
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
  }

  track(eventName, eventProperties)
}

export function flushAnalyticsEvents() {
  if (__DEV__) {
    logger.info('telemetry', 'flushAnalyticsEvents', 'flushing analytics events')
  }
  flush()
}

// didn't want to set it to Amplitude's type to keep it loose from their implementation
type ValidPropertyValue = number | string | boolean | Array<string | number>

export function setUserProperty(property: UserPropertyName, value: ValidPropertyValue) {
  if (__DEV__) {
    logger.info('telemetry', 'setUserProperty', `property: ${property}, value: ${value}`)
  }
  identify(new Identify().set(property, value))
}

//#endregion
