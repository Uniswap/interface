import { track } from '@amplitude/analytics-browser'
import { isProductionEnv } from 'utils/env'

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
