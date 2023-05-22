import {
  flush,
  Identify,
  identify,
  init,
  setDeviceId,
  track,
} from '@amplitude/analytics-react-native'
import { getUniqueId } from 'react-native-device-info'
import { ApplicationTransport } from 'src/features/telemetry/ApplicationTransport'
import { UserPropertyName } from 'src/features/telemetry/constants'
import { EventProperties } from 'src/features/telemetry/types'
import { uniswapUrls } from 'wallet/src/constants/urls'
import { logger } from 'wallet/src/features/logger/logger'

const DUMMY_KEY = '00000000000000000000000000000000'

export async function initAnalytics(): Promise<void> {
  try {
    init(
      // Amplitude custom reverse proxy takes care of API key
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
