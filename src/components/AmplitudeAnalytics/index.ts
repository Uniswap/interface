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
    console.log(`[amplitude(${eventName})]: ${JSON.stringify(eventProperties)}`)
    return
  }

  track(eventName, eventProperties)
}

/**
 * Class that exposes methods to mutate the User Model's properties in
 * Amplitude that represents the current session's user.
 *
 * See https://help.amplitude.com/hc/en-us/articles/115002380567-User-properties-and-event-properties
 * for details.
 */
class UserModel {
  constructor(private isDevEnvironment = process.env.NODE_ENV === 'development') {}

  private log(method: string, ...parameters: unknown[]) {
    console.debug(`[amplitude(Identify)]: ${method}(${parameters})`)
  }

  private call(mutate: (event: Identify) => Identify) {
    if (this.isDevEnvironment) {
      const log = (_: Identify, method: string) => this.log.bind(this, method)
      mutate(new Proxy(new Identify(), { get: log }))
      return
    }
    identify(mutate(new Identify()))
  }

  set(key: string, value: string | number) {
    this.call((event) => event.set(key, value))
  }

  setOnce(key: string, value: string | number) {
    this.call((event) => event.setOnce(key, value))
  }

  add(key: string, value: string | number) {
    this.call((event) => event.add(key, typeof value === 'number' ? value : 0))
  }

  postInsert(key: string, value: string | number) {
    this.call((event) => event.postInsert(key, value))
  }

  remove(key: string, value: string | number) {
    this.call((event) => event.remove(key, value))
  }
}

export const user = new UserModel()
