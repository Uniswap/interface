import { Identify, identify, init, track } from '@amplitude/analytics-browser'

import { UserPropertyOperations } from './constants'

export function initializeAnalytics() {
  if (process.env.NODE_ENV === 'development') return

  const API_KEY = process.env.REACT_APP_AMPLITUDE_KEY
  if (typeof API_KEY === 'undefined') {
    throw new Error(`REACT_APP_AMPLITUDE_KEY must be a defined environment variable`)
  }

  init(API_KEY)
}

export function sendAnalyticsEvent(eventName: string, eventProperties?: Record<string, unknown>) {
  track(eventName, eventProperties)
}

export function updateAnalyticsUserModel(
  operation: UserPropertyOperations,
  propertyName: string,
  propertyValue: string | number
) {
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
