import { Identify, identify, init, track } from '@amplitude/analytics-browser'
import { isProductionEnv } from 'utils/env'

/**
 * Initializes Amplitude with API key for project.
 *
 * Uniswap has two Amplitude projects: test and production. You must be a
 * member of the organization on Amplitude to view details.
 */
export function initializeAnalytics() {
  const API_KEY = isProductionEnv() ? process.env.REACT_APP_AMPLITUDE_KEY : process.env.REACT_APP_AMPLITUDE_TEST_KEY

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
        ipAddress: false,
        carrier: false,
        city: false,
        region: false,
        dma: false, // designated market area
      },
    }
  )
}

/** Sends an approved (finalized) event to Amplitude production project. */
export function sendAnalyticsEvent(eventName: string, eventProperties?: Record<string, unknown>) {
  if (!isProductionEnv()) {
    console.log(`[amplitude(${eventName})]: ${JSON.stringify(eventProperties)}`)
    return
  }

  track(eventName, eventProperties)
}

/** Sends a draft event to Amplitude test project. */
export function sendTestAnalyticsEvent(eventName: string, eventProperties?: Record<string, unknown>) {
  if (isProductionEnv()) return

  track(eventName, eventProperties)
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
