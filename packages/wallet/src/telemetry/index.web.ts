import { logger } from 'utilities/src/logger/logger'
import { analytics } from 'utilities/src/telemetry/analytics/analytics'
import { WalletAppsFlyerEventProperties, WalletEventProperties } from 'wallet/src/telemetry/types'

export function sendWalletAnalyticsEvent<EventName extends keyof WalletEventProperties>(
  ...args: undefined extends WalletEventProperties[EventName]
    ? [EventName] | [EventName, WalletEventProperties[EventName]]
    : [EventName, WalletEventProperties[EventName]]
): void {
  const [eventName, eventProperties] = args
  analytics.sendEvent(eventName, eventProperties as Record<string, unknown>)
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
