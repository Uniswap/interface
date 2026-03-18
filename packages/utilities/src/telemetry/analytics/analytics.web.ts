import { flush, getUserId, Identify, identify, init, setDeviceId, track } from '@amplitude/analytics-browser'
import { ANONYMOUS_DEVICE_ID } from '@uniswap/analytics'
import { getChromeWithThrow } from 'utilities/src/chrome/chrome'
import {
  Analytics,
  AnalyticsInitConfig,
  TestnetModeConfig,
  UserPropertyValue,
  // biome-ignore lint/style/noRestrictedImports: needed here
} from 'utilities/src/telemetry/analytics/analytics'
import {
  ALLOW_ANALYTICS_ATOM_KEY,
  AMPLITUDE_SHARED_TRACKING_OPTIONS,
  ANONYMOUS_EVENT_NAMES,
  DUMMY_KEY,
} from 'utilities/src/telemetry/analytics/constants'
import { generateAnalyticsLoggers } from 'utilities/src/telemetry/analytics/logging'
import { getProcessedEvent } from 'utilities/src/telemetry/analytics/utils'

const loggers = generateAnalyticsLoggers('telemetry/analytics.web')
let allowAnalytics: boolean = true
let testnetMode: boolean = false
let testnetModeConfig: TestnetModeConfig | undefined
let commitHash: Maybe<string>
let userId: Maybe<string>

async function setAnalyticsAtomDirect(allowed: boolean): Promise<void> {
  try {
    window.localStorage.setItem(ALLOW_ANALYTICS_ATOM_KEY, JSON.stringify(allowed))
    document.dispatchEvent(new Event('analyticsToggled'))
  } catch {
    const chrome = getChromeWithThrow()
    await chrome.storage.local.set({ ALLOW_ANALYTICS_ATOM_KEY: JSON.stringify(allowed) })
  }
}

async function getAnalyticsAtomFromStorage(): Promise<boolean> {
  try {
    return window.localStorage.getItem(ALLOW_ANALYTICS_ATOM_KEY) !== 'false'
  } catch {
    const chrome = getChromeWithThrow()
    const res = await chrome.storage.local.get(ALLOW_ANALYTICS_ATOM_KEY)
    return res[ALLOW_ANALYTICS_ATOM_KEY] !== 'false'
  }
}

export async function getAnalyticsAtomDirect(forceRead?: boolean): Promise<boolean> {
  if (forceRead) {
    allowAnalytics = await getAnalyticsAtomFromStorage()
  }

  return allowAnalytics
}

// Listen for changes from other areas
const updateLocalVar = async (): Promise<void> => {
  allowAnalytics = await getAnalyticsAtomFromStorage()
}
try {
  window.document.addEventListener('analyticsToggled', updateLocalVar, false)
} catch {
  const chrome = getChromeWithThrow()
  chrome.storage.local.onChanged.addListener(updateLocalVar)
}

export const analytics: Analytics = {
  async init({ transportProvider, allowed, initHash, userIdGetter }: AnalyticsInitConfig): Promise<void> {
    // Set properties
    commitHash = initHash
    await setAnalyticsAtomDirect(allowed)

    try {
      init(
        DUMMY_KEY, // Amplitude custom reverse proxy takes care of API key
        undefined, // User ID should be undefined to let Amplitude default to Device ID
        {
          transportProvider, // Used to support custom reverse proxy header
          // Disable tracking of private user information by Amplitude
          trackingOptions: AMPLITUDE_SHARED_TRACKING_OPTIONS,
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
    await setAnalyticsAtomDirect(allowed)
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
    if (!allowAnalytics && !ANONYMOUS_EVENT_NAMES.includes(eventName)) {
      return
    }
    const propertiesWithHash: Record<string, unknown> = {
      ...eventProperties,
      ...(commitHash ? { git_commit_hash: commitHash } : {}),
    }

    const processedTestnetEvent = getProcessedEvent({
      eventName,
      eventProperties: propertiesWithHash,
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
  async setUserProperty(property: string, value: UserPropertyValue, insert?: boolean): Promise<void> {
    if (!(await getAnalyticsAtomDirect())) {
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
