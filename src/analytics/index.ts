import { Identify, identify, init, track } from '@amplitude/analytics-browser'
import { isProductionEnv } from 'utils/env'

const API_KEY = isProductionEnv() ? process.env.REACT_APP_AMPLITUDE_KEY : process.env.REACT_APP_AMPLITUDE_TEST_KEY

/**
 * Initializes Amplitude with API key for project.
 *
 * Uniswap has two Amplitude projects: test and production. You must be a
 * member of the organization on Amplitude to view details.
 */
export function initializeAnalytics() {
  if (typeof API_KEY === 'undefined') {
    const keyName = isProductionEnv() ? 'REACT_APP_AMPLITUDE_KEY' : 'REACT_APP_AMPLITUDE_TEST_KEY'
    console.error(`${keyName} is undefined, Amplitude analytics will not run.`)
    return
  }
  init(
    API_KEY,
    /* userId= */ undefined, // User ID should be undefined to let Amplitude default to Device ID
    /* options= */
    {
      // Disable tracking of private user information by Amplitude
      trackingOptions: {
        // IP is being dropped before ingestion on Amplitude side, only being used to determine country.
        ipAddress: isProductionEnv() ? false : true,
        carrier: false,
        city: false,
        region: false,
        dma: false, // designated market area
      },
    }
  )
}

/** Sends an event to Amplitude. */
export function sendAnalyticsEvent(eventName: string, eventProperties?: Record<string, unknown>) {
  const origin = window.location.origin
  if (!API_KEY) {
    console.log(`[analytics(${eventName})]: ${JSON.stringify(eventProperties)}`)
    return
  }

  track(eventName, { ...eventProperties, origin })
}

type Value = string | number | boolean | string[] | number[]

/**
 * Class that exposes methods to mutate the User Model's properties in
 * Amplitude that represents the current session's user.
 *
 * See https://help.amplitude.com/hc/en-us/articles/115002380567-User-properties-and-event-properties
 * for details.
 */
class UserModel {
  private log(method: string, ...parameters: unknown[]) {
    console.debug(`[amplitude(Identify)]: ${method}(${parameters})`)
  }

  private call(mutate: (event: Identify) => Identify) {
    if (!isProductionEnv()) {
      const log = (_: Identify, method: string) => this.log.bind(this, method)
      mutate(new Proxy(new Identify(), { get: log }))
      return
    }
    identify(mutate(new Identify()))
  }

  set(key: string, value: Value) {
    this.call((event) => event.set(key, value))
  }

  setOnce(key: string, value: Value) {
    this.call((event) => event.setOnce(key, value))
  }

  add(key: string, value: number) {
    this.call((event) => event.add(key, value))
  }

  postInsert(key: string, value: string | number) {
    this.call((event) => event.postInsert(key, value))
  }

  remove(key: string, value: string | number) {
    this.call((event) => event.remove(key, value))
  }
}

export const user = new UserModel()
