import { AppsFlyerEventProperties, UniverseEventProperties } from 'uniswap/src/features/telemetry/types'
import { NotImplementedError } from 'utilities/src/errors'

export function sendAnalyticsEvent<EventName extends keyof UniverseEventProperties>(
  ..._args: undefined extends UniverseEventProperties[EventName]
    ? [EventName] | [EventName, UniverseEventProperties[EventName]]
    : [EventName, UniverseEventProperties[EventName]]
): void {
  throw new NotImplementedError('sendWalletAnalyticsEvent')
}

export async function sendAppsFlyerEvent<EventName extends keyof AppsFlyerEventProperties>(
  ..._args: undefined extends AppsFlyerEventProperties[EventName]
    ? [EventName] | [EventName, AppsFlyerEventProperties[EventName]]
    : [EventName, AppsFlyerEventProperties[EventName]]
): Promise<void> {
  throw new NotImplementedError('sendWalletAppsFlyerEvent')
}
