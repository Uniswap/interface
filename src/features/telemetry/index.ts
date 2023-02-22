import {
  flush,
  Identify,
  identify,
  init,
  setDeviceId,
  track,
} from '@amplitude/analytics-react-native'
import * as Sentry from '@sentry/react-native'
import { Primitive, SeverityLevel } from '@sentry/types'
import { getUniqueId } from 'react-native-device-info'
import { uniswapUrls } from 'src/constants/urls'
import { ApplicationTransport } from 'src/features/telemetry/ApplicationTransport'
import { UserPropertyName } from 'src/features/telemetry/constants'
import { EventProperties } from 'src/features/telemetry/types'
import { logger } from 'src/utils/logger'

type LogTags = {
  [key: string]: Primitive
}

const DUMMY_KEY = '00000000000000000000000000000000'

export async function initAnalytics(): Promise<void> {
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
    setDeviceId(await getUniqueId()) // Ensure we're using the same deviceId across Amplitude and Statsig
  } catch (err) {
    logger.error('telemetry/index', 'initiAnalytics', `${err}`)
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
export function captureException(context: string, error: unknown, extraTags?: LogTags): void {
  Sentry.captureException(error, { tags: { ...(extraTags || {}), mobileContext: context } })
}

/**
 * Sends a message to our Sentry Dashboard
 *
 * @param level Sentry severity level
 * @param context Context from where this method is called
 * @param message Message
 * @param extraTags Key/value pairs to enrich logging and allow filtering.
 *                  More info here: https://docs.sentry.io/platforms/react-native/enriching-events/tags/
 */
export function captureMessage(
  level: SeverityLevel,
  context: string,
  message: string,
  extraTags?: LogTags
): void {
  Sentry.captureMessage(message, { level, tags: { ...(extraTags || {}), mobileContext: context } })
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
): void {
  const [eventName, eventProperties] = args
  if (__DEV__) {
    logger.debug(
      'telemetry',
      'sendAnalyticsEvent',
      `[analytics(${eventName})]: ${JSON.stringify(eventProperties)}`
    )
  }

  track(eventName, eventProperties)
}

export function flushAnalyticsEvents(): void {
  if (__DEV__) {
    logger.debug('telemetry', 'flushAnalyticsEvents', 'flushing analytics events')
  }
  flush()
}

// didn't want to set it to Amplitude's type to keep it loose from their implementation
type ValidPropertyValue = number | string | boolean | Array<string | number>

export function setUserProperty(property: UserPropertyName, value: ValidPropertyValue): void {
  if (__DEV__) {
    logger.debug('telemetry', 'setUserProperty', `property: ${property}, value: ${value}`)
  }
  identify(new Identify().set(property, value))
}

//#endregion
