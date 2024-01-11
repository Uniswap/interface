import { logger } from 'utilities/src/logger/logger'
import { WalletAppsFlyerEventProperties, WalletEventProperties } from 'wallet/src/telemetry/types'

export function sendWalletAnalyticsEvent<EventName extends keyof WalletEventProperties>(
  ...args: undefined extends WalletEventProperties[EventName]
    ? [EventName] | [EventName, WalletEventProperties[EventName]]
    : [EventName, WalletEventProperties[EventName]]
): void {
  logger.info('telemetry/index.web.ts', 'sendWalletAnalyticsEvent', 'method not supported', args)
}

export async function sendWalletAppsFlyerEvent<
  EventName extends keyof WalletAppsFlyerEventProperties
>(
  ...args: undefined extends WalletAppsFlyerEventProperties[EventName]
    ? [EventName] | [EventName, WalletAppsFlyerEventProperties[EventName]]
    : [EventName, WalletAppsFlyerEventProperties[EventName]]
): Promise<void> {
  logger.info('telemetry/index.web.ts', 'sendWalletAppsFlyerEvent', 'method not supported', args)
}
