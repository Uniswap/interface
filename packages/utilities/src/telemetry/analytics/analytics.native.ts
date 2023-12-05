import {
  flush,
  Identify,
  identify,
  init,
  setDeviceId,
  track,
} from '@amplitude/analytics-react-native'
import { getUniqueId } from 'react-native-device-info'
import { ApplicationTransport } from 'utilities/src/telemetry/analytics/ApplicationTransport'
import { Analytics, UserPropertyValue } from './analytics'
import {
  AMPLITUDE_NATIVE_TRACKING_OPTIONS,
  AMPLITUDE_SHARED_TRACKING_OPTIONS,
  DUMMY_KEY,
} from './constants'
import { generateErrorLoggers } from './logging'

const errorLoggers = generateErrorLoggers('telemetry/analytics.native')

export const analytics: Analytics = {
  async init(transportProvider: ApplicationTransport): Promise<void> {
    try {
      init(
        DUMMY_KEY, // Amplitude custom reverse proxy takes care of API key
        undefined, // User ID should be undefined to let Amplitude default to Device ID
        {
          transportProvider, // Used to support custom reverse proxy header
          // Disable tracking of private user information by Amplitude
          trackingOptions: {
            ...AMPLITUDE_SHARED_TRACKING_OPTIONS,
            ...AMPLITUDE_NATIVE_TRACKING_OPTIONS,
          },
        }
      )
      setDeviceId(await getUniqueId()) // Ensure we're using the same deviceId across Amplitude and Statsig
    } catch (error) {
      errorLoggers.init(error)
    }
  },
  sendEvent(eventName: string, eventProperties?: Record<string, unknown>): void {
    errorLoggers.sendEvent(eventName, eventProperties)
    track(eventName, eventProperties)
  },
  flushEvents(): void {
    errorLoggers.flushEvents()
    flush()
  },
  setUserProperty(property: string, value: UserPropertyValue): void {
    errorLoggers.setUserProperty(property, value)
    identify(new Identify().set(property, value))
  },
}
