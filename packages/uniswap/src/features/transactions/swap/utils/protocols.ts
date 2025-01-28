import { useMemo } from 'react'
import { ProtocolItems } from 'uniswap/src/data/tradingApi/__generated__'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { getFeatureFlag, useFeatureFlag } from 'uniswap/src/features/gating/hooks'

export const DEFAULT_PROTOCOL_OPTIONS = [
  // `as const` allows us to derive a type narrower than ProtocolItems, and the `...` spread removes readonly, allowing DEFAULT_PROTOCOL_OPTIONS to be passed around as an argument without `readonly`
  ...([ProtocolItems.UNISWAPX_V2, ProtocolItems.V4, ProtocolItems.V3, ProtocolItems.V2] as const),
]
export type FrontendSupportedProtocol = (typeof DEFAULT_PROTOCOL_OPTIONS)[number]

const LAUNCHED_UNISWAPX_CHAINS = [UniverseChainId.Mainnet]

/** Given a list of `userSelectedProtocols`, returns protocol items that are allowed for the given chain. */
export function useProtocolsForChain(
  userSelectedProtocols: FrontendSupportedProtocol[],
  chainId?: UniverseChainId,
): ProtocolItems[] {
  const uniswapXEnabled = useFeatureFlag(FeatureFlags.UniswapX)
  const priorityOrdersAllowed = useUniswapXPriorityOrderFlag(chainId)
  const arbUniswapXAllowed =
    useFeatureFlag(FeatureFlags.SharedSwapArbitrumUniswapXExperiment) && chainId === UniverseChainId.ArbitrumOne

  const uniswapXAllowedForChain =
    (chainId && LAUNCHED_UNISWAPX_CHAINS.includes(chainId)) || priorityOrdersAllowed || arbUniswapXAllowed
  const v4SwapAllowed = useFeatureFlag(FeatureFlags.V4Swap)

  return useMemo(() => {
    let protocols = [...userSelectedProtocols]

    // Remove UniswapX from the options we send to TradingAPI if UniswapX hasn't been launched or isn't in experiment on that chain
    if (!uniswapXAllowedForChain || !uniswapXEnabled) {
      protocols = protocols.filter((protocol) => protocol !== ProtocolItems.UNISWAPX_V2)
    }

    if (!v4SwapAllowed) {
      protocols = protocols.filter((protocol) => protocol !== ProtocolItems.V4)
    }

    return protocols
  }, [uniswapXAllowedForChain, uniswapXEnabled, userSelectedProtocols, v4SwapAllowed])
}

export function useUniswapXPriorityOrderFlag(chainId?: UniverseChainId): boolean {
  if (!chainId) {
    return false
  }

  const flagName = UNISWAP_PRIORITY_ORDERS_CHAIN_FLAG_MAP[chainId]
  if (!flagName) {
    return false
  }

  return getFeatureFlag(flagName)
}

// These are primarily OP stack chains, since only Priority Orders can only operate on chains with Priority Gas Auctions (PGA)
const UNISWAP_PRIORITY_ORDERS_CHAIN_FLAG_MAP: Partial<Record<UniverseChainId, FeatureFlags>> = {
  [UniverseChainId.Base]: FeatureFlags.UniswapXPriorityOrdersBase,
  [UniverseChainId.Optimism]: FeatureFlags.UniswapXPriorityOrdersOptimism,
  [UniverseChainId.Unichain]: FeatureFlags.UniswapXPriorityOrdersUnichain,
}
