import { NotImplementedError } from 'utilities/src/errors'
import { WalletAppsFlyerEventProperties, WalletEventProperties } from 'wallet/src/telemetry/types'

export function sendWalletAnalyticsEvent<EventName extends keyof WalletEventProperties>(
  ..._args: undefined extends WalletEventProperties[EventName]
    ? [EventName] | [EventName, WalletEventProperties[EventName]]
    : [EventName, WalletEventProperties[EventName]]
): void {
  throw new NotImplementedError('sendWalletAnalyticsEvent')
}

export async function sendWalletAppsFlyerEvent<
  EventName extends keyof WalletAppsFlyerEventProperties
>(
  ..._args: undefined extends WalletAppsFlyerEventProperties[EventName]
    ? [EventName] | [EventName, WalletAppsFlyerEventProperties[EventName]]
    : [EventName, WalletAppsFlyerEventProperties[EventName]]
): Promise<void> {
  throw new NotImplementedError('sendWalletAppsFlyerEvent')
}
