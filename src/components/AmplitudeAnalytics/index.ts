import { Identify, identify, init, track } from '@amplitude/analytics-browser'

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
  private _isDevEnvironemnt = true

  constructor() {
    process.env.NODE_ENV === 'development' ? (this._isDevEnvironemnt = true) : (this._isDevEnvironemnt = false)
  }

  public set(propertyName: string, propertyValue: string | number) {
    if (this._isDevEnvironemnt) {
      console.log('amplitude user model update with operation set:', `${propertyName}: ${propertyValue}`)
      return
    }
    const identifyObj = new Identify()
    identifyObj.set(propertyName, propertyValue)
    identify(identifyObj)
  }

  public setOnce(propertyName: string, propertyValue: string | number) {
    if (this._isDevEnvironemnt) {
      console.log('amplitude user model update with operation setOnce:', `${propertyName}: ${propertyValue}`)
      return
    }
    const identifyObj = new Identify()
    identifyObj.setOnce(propertyName, propertyValue)
    identify(identifyObj)
  }

  public add(propertyName: string, propertyValue: string | number) {
    if (this._isDevEnvironemnt) {
      console.log('amplitude user model update with operation add:', `${propertyName}: ${propertyValue}`)
      return
    }
    const identifyObj = new Identify()
    identifyObj.add(propertyName, typeof propertyValue === 'number' ? propertyValue : 0)
    identify(identifyObj)
  }

  public postInsert(propertyName: string, propertyValue: string | number) {
    if (this._isDevEnvironemnt) {
      console.log('amplitude user model update with operation postInsert:', `${propertyName}: ${propertyValue}`)
      return
    }
    const identifyObj = new Identify()
    identifyObj.postInsert(propertyName, propertyValue)
    identify(identifyObj)
  }

  public remove(propertyName: string, propertyValue: string | number) {
    if (this._isDevEnvironemnt) {
      console.log('amplitude user model update with operation remove:', `${propertyName}: ${propertyValue}`)
      return
    }
    const identifyObj = new Identify()
    identifyObj.remove(propertyName, propertyValue)
    identify(identifyObj)
  }
}

export const userModel = new UserModel()
