import { UserPropertyName } from 'src/features/telemetry/constants'
import { MobileEventProperties } from 'src/features/telemetry/types'
import { analytics, UserPropertyValue } from 'utilities/src/telemetry/analytics/analytics'

export function sendMobileAnalyticsEvent<EventName extends keyof MobileEventProperties>(
  ...args: undefined extends MobileEventProperties[EventName]
    ? [EventName] | [EventName, MobileEventProperties[EventName]]
    : [EventName, MobileEventProperties[EventName]]
): void {
  const [eventName, eventProperties] = args
  analytics.sendEvent(eventName, eventProperties as Record<string, unknown>)
}

export function setUserProperty(property: UserPropertyName, value: UserPropertyValue): void {
  analytics.setUserProperty(property, value)
}
