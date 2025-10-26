import { AppsFlyerEventProperties, UniverseEventProperties } from 'uniswap/src/features/telemetry/types'
import { logger } from 'utilities/src/logger/logger'
// biome-ignore lint/style/noRestrictedImports: legacy import will be migrated
import { analytics } from 'utilities/src/telemetry/analytics/analytics'

export function sendAnalyticsEvent<EventName extends keyof UniverseEventProperties>(
  ...args: undefined extends UniverseEventProperties[EventName]
    ? [EventName] | [EventName, UniverseEventProperties[EventName]]
    : [EventName, UniverseEventProperties[EventName]]
): void {
  const [eventName, eventProperties] = args
  analytics.sendEvent(eventName, eventProperties as Record<string, unknown>)
}

export async function sendAppsFlyerEvent<EventName extends keyof AppsFlyerEventProperties>(
  ...args: undefined extends AppsFlyerEventProperties[EventName]
    ? [EventName] | [EventName, AppsFlyerEventProperties[EventName]]
    : [EventName, AppsFlyerEventProperties[EventName]]
): Promise<void> {
  logger.warn('telemetry/index.web.ts', 'sendWalletAppsFlyerEvent', 'method not supported', args)
}
