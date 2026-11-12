import { TradingApi } from '@universe/api'

/**
 * The bridge vendors the apps can approve and display, offered in Bridging options. The Trading API serves a vendor
 * other than Across only to callers that list it, so a vendor added to the API stays off until it is added here.
 */
export const SUPPORTED_BRIDGE_PROVIDERS: TradingApi.BridgeProvider[] = [
  TradingApi.BridgeProvider.ACROSS,
  TradingApi.BridgeProvider.RELAY,
]

const BRIDGE_PROVIDER_NAMES: Record<TradingApi.BridgeProvider, string> = {
  [TradingApi.BridgeProvider.ACROSS]: 'Across',
  [TradingApi.BridgeProvider.RELAY]: 'Relay',
}

/**
 * The vendor's name for running text, e.g. "via Relay". Undefined for a vendor the API names that this client predates,
 * since API responses are not validated against the enum.
 */
export function getBridgeProviderName(provider: TradingApi.BridgeProvider): string | undefined {
  const name: string | undefined = BRIDGE_PROVIDER_NAMES[provider]
  return name
}
