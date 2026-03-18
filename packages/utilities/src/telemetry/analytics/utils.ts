import { isWebApp } from 'utilities/src/platform'
// biome-ignore lint/style/noRestrictedImports: Platform-specific implementation needs internal types
import { type TestnetModeConfig } from 'utilities/src/telemetry/analytics/analytics'

export function getProcessedEvent({
  eventName,
  eventProperties,
  testnetModeConfig,
  isTestnetMode,
}: {
  eventName: string
  eventProperties: Record<string, unknown>
  testnetModeConfig: Maybe<TestnetModeConfig>
  isTestnetMode: Maybe<boolean>
}): { eventName: string; eventProperties: Record<string, unknown> } | undefined {
  if (!isTestnetMode) {
    return { eventName, eventProperties }
  }

  // do not track testnet mode events in the interface
  if (isWebApp) {
    return undefined
  }

  if (testnetModeConfig?.passthroughAllowlistEvents.includes(eventName)) {
    return { eventName, eventProperties }
  }

  if (testnetModeConfig?.allowlistEvents.includes(eventName)) {
    return {
      eventName: testnetModeConfig.aggregateEventName,
      eventProperties: { ...eventProperties, eventName },
    }
  }

  return undefined
}
