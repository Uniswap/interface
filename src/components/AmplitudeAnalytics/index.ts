import { Identify, identify, init, track } from '@amplitude/analytics-browser'

/**
 * Initializes Amplitude with API key for project.
 *
 * Uniswap has two Amplitude projects: test and production. You must be a
 * member of the organization on Amplitude to view details.
 */
export function initializeAnalytics(isDevEnvironment = process.env.NODE_ENV === 'development') {
  if (isDevEnvironment) return

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
        dma: false, // designated market area
      },
    }
  )
}

/** Sends an event to Amplitude. */
export function sendAnalyticsEvent(eventName: string, eventProperties?: Record<string, unknown>) {
  if (process.env.NODE_ENV === 'development') {
    console.debug(`[amplitude(${eventName})]: ${JSON.stringify(eventProperties)}`)
    return
  }

  track(eventName, eventProperties)
}

/**
 * Class that exposes methods to modify the User Model's properties in
 * Amplitude that represents the current session's user.
 *
 * See https://help.amplitude.com/hc/en-us/articles/115002380567-User-properties-and-event-properties
 * for details.
 */
class UserModel {
  constructor(private isDevEnvironment = process.env.NODE_ENV === 'development') {}

  private log(method: string, key: string, value: unknown) {
    console.debug(`[amplitude(User)]: ${method}(${key}, ${value})`)
  }

  private call(method: 'set' | 'setOnce' | 'add' | 'postInsert' | 'remove', key: string, value: string | number) {
    if (this.isDevEnvironment) {
      return this.log(method, key, value)
    }
    const identifyObj = new Identify()
    identifyObj[method]()(key, value)
    identify(identifyObj)
  }

  set(key: string, value: string | number) {
    this.call('set', key, value)
  }

  setOnce(key: string, value: string | number) {
    this.call('setOnce', key, value)
  }

  add(key: string, value: string | number) {
    this.call('add', key, typeof value === 'number' ? value : 0)
  }

  postInsert(key: string, value: string | number) {
    this.call('postInsert', key, value)
  }

  remove(key: string, value: string | number) {
    this.call('remove', key, value)
  }
}

export const user = new UserModel()
