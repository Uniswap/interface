import { UserPropertyName } from 'src/app/features/telemetry/constants'
import { ExtensionEventProperties } from 'src/app/features/telemetry/types'
import { analytics, UserPropertyValue } from 'utilities/src/telemetry/analytics/analytics'

export function sendExtensionAnalyticsEvent<EventName extends keyof ExtensionEventProperties>(
  ...args: undefined extends ExtensionEventProperties[EventName]
    ? [EventName] | [EventName, ExtensionEventProperties[EventName]]
    : [EventName, ExtensionEventProperties[EventName]]
): void {
  const [eventName, eventProperties] = args
  // note: can remove the as unknown case once there are events in ExtensionEventProperties
  analytics.sendEvent(eventName, eventProperties as unknown as Record<string, unknown>)
}

export function setUserProperty(property: UserPropertyName, value: UserPropertyValue): void {
  analytics.setUserProperty(property, value)
}
