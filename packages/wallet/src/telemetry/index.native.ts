import appsFlyer from 'react-native-appsflyer'
import { analytics } from 'utilities/src/telemetry/analytics/analytics'
import { WalletAppsFlyerEventProperties, WalletEventProperties } from 'wallet/src/telemetry/types'

export function sendWalletAnalyticsEvent<EventName extends keyof WalletEventProperties>(
  ...args: undefined extends WalletEventProperties[EventName]
    ? [EventName] | [EventName, WalletEventProperties[EventName]]
    : [EventName, WalletEventProperties[EventName]]
): void {
  const [eventName, eventProperties] = args
  // note: can remove the as unknown case once there are events in ExtensionEventProperties
  analytics.sendEvent(eventName, eventProperties as unknown as Record<string, unknown>)
}

export async function sendWalletAppsFlyerEvent<
  EventName extends keyof WalletAppsFlyerEventProperties
>(
  ...args: undefined extends WalletAppsFlyerEventProperties[EventName]
    ? [EventName] | [EventName, WalletAppsFlyerEventProperties[EventName]]
    : [EventName, WalletAppsFlyerEventProperties[EventName]]
): Promise<void> {
  const [eventName, eventProperties] = args
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.debug('sendWalletAppsFlyerEvent', eventName, eventProperties)
  } else {
    await appsFlyer.logEvent(eventName, eventProperties ?? {})
  }
}
