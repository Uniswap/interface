import { Identify, identify, init, track } from '@amplitude/analytics-browser'

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

export function sendAnalyticsEvent(eventName: string, eventProperties?: Record<string, unknown>) {
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
  private call(mutate: (event: Identify) => Identify) {
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
