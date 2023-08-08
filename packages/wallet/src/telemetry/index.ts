import { analytics } from 'utilities/src/telemetry/analytics/analytics'
import { WalletEventProperties } from 'wallet/src/telemetry/types'

export function sendWalletAnalyticsEvent<EventName extends keyof WalletEventProperties>(
  ...args: undefined extends WalletEventProperties[EventName]
    ? [EventName] | [EventName, WalletEventProperties[EventName]]
    : [EventName, WalletEventProperties[EventName]]
): void {
  const [eventName, eventProperties] = args
  // note: can remove the as unknown case once there are events in ExtensionEventProperties
  analytics.sendEvent(eventName, eventProperties as unknown as Record<string, unknown>)
}
