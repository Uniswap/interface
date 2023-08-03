import { flush, Identify, identify, init, track } from '@amplitude/analytics-browser'
import { ApplicationTransport } from 'utilities/src/telemetry/analytics/ApplicationTransport'
import { Analytics, UserPropertyValue } from './analytics'
import { AMPLITUDE_SHARED_TRACKING_OPTIONS, DUMMY_KEY } from './constants'
import { generateErrorLoggers as generateAnalyticsLoggers } from './logging'

const loggers = generateAnalyticsLoggers('telemetry/analytics.web')

export const analytics: Analytics = {
  async init(transportProvider: ApplicationTransport): Promise<void> {
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
  sendEvent(eventName: string, eventProperties?: Record<string, unknown>): void {
    loggers.sendEvent(eventName, eventProperties)
    track(eventName, eventProperties)
  },
  flushEvents(): void {
    loggers.flushEvents()
    flush()
  },
  setUserProperty(property: string, value: UserPropertyValue): void {
    loggers.setUserProperty(property, value)
    identify(new Identify().set(property, value))
  },
}
