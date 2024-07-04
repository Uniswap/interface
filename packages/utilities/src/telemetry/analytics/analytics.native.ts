/* eslint-disable no-restricted-imports */
import { Identify, flush, getUserId, identify, init, setDeviceId, track } from '@amplitude/analytics-react-native'
import { ANONYMOUS_DEVICE_ID } from '@uniswap/analytics'
import { ApplicationTransport } from 'utilities/src/telemetry/analytics/ApplicationTransport'
import { Analytics, UserPropertyValue } from 'utilities/src/telemetry/analytics/analytics'
import {
  AMPLITUDE_NATIVE_TRACKING_OPTIONS,
  AMPLITUDE_SHARED_TRACKING_OPTIONS,
  ANONYMOUS_EVENT_NAMES,
  DUMMY_KEY,
} from 'utilities/src/telemetry/analytics/constants'
import { generateAnalyticsLoggers } from 'utilities/src/telemetry/analytics/logging'

const loggers = generateAnalyticsLoggers('telemetry/analytics.native')

let allowAnalytics: Maybe<boolean>
let userId: Maybe<string>

export async function getAnalyticsAtomDirect(_forceRead?: boolean): Promise<boolean> {
  return allowAnalytics ?? true
}

export const analytics: Analytics = {
  async init(
    transportProvider: ApplicationTransport,
    allowed: boolean,
    _initHash?: string,
    userIdGetter?: () => Promise<string>,
  ): Promise<void> {
    try {
      allowAnalytics = allowed
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
        },
      )

      userId = userIdGetter ? await userIdGetter() : getUserId()

      if (allowed && userId) {
        setDeviceId(userId)
      }

      if (!allowed) {
        setDeviceId(ANONYMOUS_DEVICE_ID)
      }
    } catch (error) {
      loggers.init(error)
    }
  },
  async setAllowAnalytics(allowed: boolean): Promise<void> {
    allowAnalytics = allowed
    if (allowed) {
      if (userId) {
        setDeviceId(userId)
      }
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
  setUserProperty(property: string, value: UserPropertyValue, insert?: boolean): void {
    if (!allowAnalytics) {
      return
    }

    if (insert) {
      identify(new Identify().postInsert(property, value))
    } else {
      loggers.setUserProperty(property, value)
      identify(new Identify().set(property, value))
    }
  },
}
