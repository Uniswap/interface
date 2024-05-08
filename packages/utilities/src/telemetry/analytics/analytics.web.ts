import { flush, Identify, identify, init, setDeviceId, track } from '@amplitude/analytics-browser'
import { ANONYMOUS_DEVICE_ID } from '@uniswap/analytics'
import { ApplicationTransport } from 'utilities/src/telemetry/analytics/ApplicationTransport'
import { Analytics, UserPropertyValue } from './analytics'
import { AMPLITUDE_SHARED_TRACKING_OPTIONS, ANONYMOUS_EVENT_NAMES, DUMMY_KEY } from './constants'
import { generateAnalyticsLoggers } from './logging'

const loggers = generateAnalyticsLoggers('telemetry/analytics.web')

let allowAnalytics: Maybe<boolean>

export const analytics: Analytics = {
  async init(transportProvider: ApplicationTransport, allowed: boolean): Promise<void> {
    allowAnalytics = allowed
    try {
      init(
        DUMMY_KEY, // Amplitude custom reverse proxy takes care of API key
        undefined, // User ID should be undefined to let Amplitude default to Device ID
        {
          transportProvider, // Used to support custom reverse proxy header
          // Disable tracking of private user information by Amplitude
          trackingOptions: AMPLITUDE_SHARED_TRACKING_OPTIONS,
        }
      )
    } catch (error) {
      loggers.init(error)
    }
  },
  async setAllowAnalytics(allowed: boolean): Promise<void> {
    allowAnalytics = allowed
    if (allowed) {
      // TODO: handle setting device id to a new or existing old id here
    } else {
      loggers.setAllowAnalytics(allowed)
      identify(new Identify().clearAll()) // Clear all custom user properties
      setDeviceId(ANONYMOUS_DEVICE_ID)
    }
  },
  sendEvent(eventName: string, eventProperties?: Record<string, unknown>): void {
    if (!allowAnalytics && !ANONYMOUS_EVENT_NAMES.includes(eventName)) {
      return
    }
    loggers.sendEvent(eventName, eventProperties)
    track(eventName, eventProperties)
  },
  flushEvents(): void {
    loggers.flushEvents()
    flush()
  },
  setUserProperty(property: string, value: UserPropertyValue): void {
    if (!allowAnalytics) {
      return
    }
    loggers.setUserProperty(property, value)
    identify(new Identify().set(property, value))
  },
}
