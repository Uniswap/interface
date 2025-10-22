import { flush, getUserId, Identify, identify, init, setDeviceId, track } from '@amplitude/analytics-react-native'
import { ANONYMOUS_DEVICE_ID } from '@uniswap/analytics'
import {
  Analytics,
  AnalyticsInitConfig,
  TestnetModeConfig,
  UserPropertyValue,
  // biome-ignore lint/style/noRestrictedImports: needed here
} from 'utilities/src/telemetry/analytics/analytics'
import {
  AMPLITUDE_NATIVE_TRACKING_OPTIONS,
  AMPLITUDE_SHARED_TRACKING_OPTIONS,
  ANONYMOUS_EVENT_NAMES,
  DUMMY_KEY,
} from 'utilities/src/telemetry/analytics/constants'
import { generateAnalyticsLoggers } from 'utilities/src/telemetry/analytics/logging'
import { getProcessedEvent } from 'utilities/src/telemetry/analytics/utils'

const loggers = generateAnalyticsLoggers('telemetry/analytics.native')

let initCalled: boolean = false
let allowAnalytics: Maybe<boolean>
let testnetMode: Maybe<boolean>
let testnetModeConfig: Maybe<TestnetModeConfig>
let userId: Maybe<string>

export async function getAnalyticsAtomDirect(_forceRead?: boolean): Promise<boolean> {
  return allowAnalytics ?? true
}

export const analytics: Analytics = {
  async init({ transportProvider, allowed, userIdGetter }: AnalyticsInitConfig): Promise<void> {
    try {
      // Ensure events are filtered based on the allowAnalytics setting, but not before init is called
      allowAnalytics = allowed
      initCalled = true

      // Clear all user properties if analytics are not allowed
      if (!allowed) {
        identify(new Identify().clearAll())
      }

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
  setTestnetMode(enabled: boolean, config: TestnetModeConfig): void {
    testnetMode = enabled
    testnetModeConfig = config
  },
  sendEvent(eventName: string, eventProperties?: Record<string, unknown>): void {
    if (!allowAnalytics && initCalled && !ANONYMOUS_EVENT_NAMES.includes(eventName)) {
      return
    }

    const processedTestnetEvent = getProcessedEvent({
      eventName,
      eventProperties: eventProperties || {},
      testnetModeConfig,
      isTestnetMode: testnetMode,
    })

    if (processedTestnetEvent) {
      const { eventName: processedEventName, eventProperties: processedEventProperties } = processedTestnetEvent
      loggers.sendEvent(processedEventName, processedEventProperties)
      track(processedEventName, processedEventProperties)
    }
  },
  flushEvents(): void {
    loggers.flushEvents()
    flush()
  },
  // eslint-disable-next-line max-params
  setUserProperty(property: string, value: UserPropertyValue, insert?: boolean): void {
    if (!allowAnalytics && initCalled) {
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
