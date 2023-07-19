import { BaseTransport } from '@amplitude/analytics-core'
import {
  flush,
  Identify,
  identify,
  init,
  setDeviceId,
  track,
} from '@amplitude/analytics-react-native'
import { Payload, Response, Transport } from '@amplitude/analytics-types'
import DeviceInfo, { getUniqueId } from 'react-native-device-info'
import { uniswapUrls } from 'wallet/src/constants/urls'
import { logger } from 'wallet/src/features/logger/logger'
import serializeError from 'wallet/src/utils/serializeError'
import { Analytics, UserPropertyValue } from './analytics'

const MOBILE_ORIGIN_APPLICATION = 'mobile-analytics-uniswap'
const DUMMY_KEY = '00000000000000000000000000000000'

export const analytics: Analytics = {
  async init(): Promise<void> {
    try {
      init(
        DUMMY_KEY, // Amplitude custom reverse proxy takes care of API key
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
    } catch (error) {
      logger.error('Error initializing analytics', {
        tags: {
          file: 'telemetry/analytics.native',
          function: 'init',
          error: serializeError(error),
        },
      })
    }
  },
  sendEvent(eventName: string, eventProperties?: Record<string, unknown>): void {
    if (__DEV__) {
      logger.debug(
        'telemetry/analytics.native',
        'sendEvent',
        `[analytics(${eventName})]: ${JSON.stringify(eventProperties)}`
      )
    }
    track(eventName, eventProperties)
  },
  flushEvents(): void {
    if (__DEV__) {
      logger.debug('telemetry/analytics.native', 'flushEvents', 'flushing analytics events')
    }
    flush()
  },
  setUserProperty(property: string, value: UserPropertyValue): void {
    if (__DEV__) {
      logger.debug(
        'telemetry/analytics.native',
        'setUserProperty',
        `property: ${property}, value: ${value}`
      )
    }
    identify(new Identify().set(property, value))
  },
}

/**
 * Custom Application Transport used to pass in custom `origin` header,
 * and override `serverUrl` (such as in case of using reverse proxy).
 *
 * Borrowed from: https://github.com/Uniswap/analytics/blob/main/src/analytics/ApplicationTransport.ts
 */
class ApplicationTransport extends BaseTransport implements Transport {
  constructor(private serverUrl: string) {
    super()

    /* istanbul ignore if */
    if (typeof fetch === 'undefined') {
      throw new Error('FetchTransport is not supported')
    }
  }

  async send(_serverUrl: string, payload: Payload): Promise<Response | null> {
    const request: RequestInit = {
      headers: {
        'x-origin-application': MOBILE_ORIGIN_APPLICATION,
        'Content-Type': 'application/json',
        Accept: '*/*',
        Origin: uniswapUrls.apiBaseUrl,
        'x-application-build': DeviceInfo.getBundleId(),
      },
      keepalive: true, // allow the request to outlive the page
      body: JSON.stringify(payload),
      method: 'POST',
    }
    const response = await fetch(this.serverUrl, request)
    const responseJSON: Record<string, unknown> = await response.json()
    return this.buildResponse(responseJSON)
  }
}
