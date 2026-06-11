import { ProtocolItems } from '@universe/api/src/clients/trading/__generated__'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useMemo } from 'react'

export const DEFAULT_PROTOCOL_OPTIONS = [
  // `as const` allows us to derive a type narrower than ProtocolItems, and the `...` spread removes readonly, allowing DEFAULT_PROTOCOL_OPTIONS to be passed around as an argument without `readonly`
  ...([ProtocolItems.UNISWAPX_LATEST, ProtocolItems.V4, ProtocolItems.V3, ProtocolItems.V2] as const),
]
export type FrontendSupportedProtocol = (typeof DEFAULT_PROTOCOL_OPTIONS)[number]

export function filterProtocols(
  userSelectedProtocols: FrontendSupportedProtocol[],
  uniswapXEnabled: boolean,
): ProtocolItems[] {
  if (uniswapXEnabled) {
    return userSelectedProtocols
  }

  return userSelectedProtocols.filter((protocol) => protocol !== ProtocolItems.UNISWAPX_LATEST)
}

export function useProtocols(userSelectedProtocols: FrontendSupportedProtocol[]): ProtocolItems[] {
  const uniswapXEnabled = useFeatureFlag(FeatureFlags.UniswapX)

  return useMemo(() => {
    return filterProtocols(userSelectedProtocols, uniswapXEnabled)
  }, [userSelectedProtocols, uniswapXEnabled])
}
