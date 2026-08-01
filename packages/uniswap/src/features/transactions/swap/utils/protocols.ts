import { TradingApi } from '@universe/api'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useMemo } from 'react'

export const DEFAULT_PROTOCOL_OPTIONS = [
  // `as const` allows us to derive a type narrower than TradingApi.ProtocolItems, and the `...` spread removes readonly, allowing DEFAULT_PROTOCOL_OPTIONS to be passed around as an argument without `readonly`
  ...([
    TradingApi.ProtocolItems.UNISWAPX_LATEST,
    TradingApi.ProtocolItems.V4,
    TradingApi.ProtocolItems.V3,
    TradingApi.ProtocolItems.V2,
  ] as const),
]
export type FrontendSupportedProtocol = (typeof DEFAULT_PROTOCOL_OPTIONS)[number]

export function filterProtocols(
  userSelectedProtocols: FrontendSupportedProtocol[],
  uniswapXEnabled: boolean,
): TradingApi.ProtocolItems[] {
  if (uniswapXEnabled) {
    return userSelectedProtocols
  }

  return userSelectedProtocols.filter((protocol) => protocol !== TradingApi.ProtocolItems.UNISWAPX_LATEST)
}

export function useProtocols(userSelectedProtocols: FrontendSupportedProtocol[]): TradingApi.ProtocolItems[] {
  const uniswapXEnabled = useFeatureFlag(FeatureFlags.UniswapX)

  return useMemo(() => {
    return filterProtocols(userSelectedProtocols, uniswapXEnabled)
  }, [userSelectedProtocols, uniswapXEnabled])
}
