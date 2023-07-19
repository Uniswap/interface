import { UserPropertyName } from 'src/features/telemetry/constants'
import { EventProperties } from 'src/features/telemetry/types'
import { analytics, UserPropertyValue } from 'wallet/src/features/telemetry/analytics/analytics'

export function sendAnalyticsEvent<EventName extends keyof EventProperties>(
  ...args: undefined extends EventProperties[EventName]
    ? [EventName] | [EventName, EventProperties[EventName]]
    : [EventName, EventProperties[EventName]]
): void {
  const [eventName, eventProperties] = args
  analytics.sendEvent(eventName, eventProperties as Record<string, unknown>)
}

export function setUserProperty(property: UserPropertyName, value: UserPropertyValue): void {
  analytics.setUserProperty(property, value)
}
