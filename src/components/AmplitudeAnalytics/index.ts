import { Identify, identify, init, track } from '@amplitude/analytics-browser'

import { UserPropertyOperations } from './constants'

/**
 * Initializes Amplitude with API key for project.
 *
 * Uniswap has two Amplitude projects: test and production. You must be a
 * member of the organization on Amplitude to view details.
 */
export function initializeAnalytics() {
  if (process.env.NODE_ENV === 'development') return

  const API_KEY = process.env.REACT_APP_AMPLITUDE_KEY
  if (typeof API_KEY === 'undefined') {
    throw new Error(`REACT_APP_AMPLITUDE_KEY must be a defined environment variable`)
  }

  init(
    API_KEY,
    /* userId= */ undefined, // User ID should be undefined to let Amplitude default to Device ID
    /* options= */ {
      // Disable tracking of private user information by Amplitude
      trackingOptions: {
        ipAddress: false,
        carrier: false,
        city: false,
        region: false,
        country: false,
        dma: false, // Disables designated market area tracking
      },
    }
  )
}

/** Sends an event to Amplitude. */
export function sendAnalyticsEvent(eventName: string, eventProperties?: Record<string, unknown>) {
  if (process.env.NODE_ENV === 'development') {
    console.log('amplitude event log:', `${eventName}: ${JSON.stringify(eventProperties)}`)
  }

  track(eventName, eventProperties)
}

/**
 * Updates the User Model's properties in Amplitude that represents
 * the current session's user.
 *
 * See https://help.amplitude.com/hc/en-us/articles/115002380567-User-properties-and-event-properties
 * for details.
 */
export function updateAnalyticsUserModel(
  operation: UserPropertyOperations,
  propertyName: string,
  propertyValue: string | number
) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`amplitude user model update with operation ${operation}:`, `${propertyName}: ${propertyValue}`)
  }

  const identifyObj = new Identify()
  switch (operation) {
    case UserPropertyOperations.SET:
      identifyObj.set(propertyName, propertyValue)
      break
    case UserPropertyOperations.SET_ONCE:
      identifyObj.setOnce(propertyName, propertyValue)
      break
    case UserPropertyOperations.ADD:
      identifyObj.add(propertyName, typeof propertyValue === 'number' ? propertyValue : 0)
      break
    case UserPropertyOperations.ARRAY_PREPEND:
      identifyObj.prepend(propertyName, propertyValue)
      break
    case UserPropertyOperations.ARRAY_APPEND:
      identifyObj.append(propertyName, propertyValue)
      break
    case UserPropertyOperations.ARRAY_PREINSERT:
      identifyObj.preInsert(propertyName, propertyValue)
      break
    case UserPropertyOperations.ARRAY_POSTINSERT:
      identifyObj.postInsert(propertyName, propertyValue)
      break
    case UserPropertyOperations.ARRAY_REMOVE:
      identifyObj.remove(propertyName, propertyValue)
      break
  }
  identify(identifyObj)
}
