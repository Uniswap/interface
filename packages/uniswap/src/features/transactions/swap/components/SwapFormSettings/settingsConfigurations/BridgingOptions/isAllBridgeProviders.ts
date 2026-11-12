import type { TradingApi } from '@universe/api'
import { SUPPORTED_BRIDGE_PROVIDERS } from 'uniswap/src/features/transactions/swap/utils/bridgeProviders'

export function isAllBridgeProviders(selectedBridgeProviders: TradingApi.BridgeProvider[]): boolean {
  return SUPPORTED_BRIDGE_PROVIDERS.every((provider) => selectedBridgeProviders.includes(provider))
}
