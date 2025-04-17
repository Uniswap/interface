import { useMemo } from 'react'
import { ProtocolItems } from 'uniswap/src/data/tradingApi/__generated__'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { useV4SwapEnabled } from 'uniswap/src/features/transactions/swap/hooks/useV4SwapEnabled'

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
  const isDutchV3Enabled = useFeatureFlag(FeatureFlags.ArbitrumDutchV3)
  const arbUniswapXAllowed = chainId === UniverseChainId.ArbitrumOne && isDutchV3Enabled

  const uniswapXAllowedForChain =
    (chainId && LAUNCHED_UNISWAPX_CHAINS.includes(chainId)) || priorityOrdersAllowed || arbUniswapXAllowed
  const v4SwapAllowed = useV4SwapEnabled(chainId)

  return useMemo(() => {
    let protocols: ProtocolItems[] = [...userSelectedProtocols]
    // Remove UniswapX from the options we send to TradingAPI if UniswapX hasn't been launched or isn't in experiment on that chain
    if (!uniswapXAllowedForChain || !uniswapXEnabled) {
      protocols = protocols.filter((protocol) => protocol !== ProtocolItems.UNISWAPX_V2)
    }
    // Replace UniswapXV2 with V3 if V3 experiment is enabled on arbitrum
    if (arbUniswapXAllowed) {
      protocols = protocols.map((protocol) =>
        protocol === ProtocolItems.UNISWAPX_V2 ? ProtocolItems.UNISWAPX_V3 : protocol,
      )
    }

    // Remove UniswapX from the options we send to TradingAPI if UniswapX hasn't been launched or isn't in experiment on that chain
    if (!uniswapXAllowedForChain || !uniswapXEnabled) {
      protocols = protocols.filter((protocol) => protocol !== ProtocolItems.UNISWAPX_V2)
    }

    if (!v4SwapAllowed) {
      protocols = protocols.filter((protocol) => protocol !== ProtocolItems.V4)
    }

    return protocols
  }, [uniswapXAllowedForChain, uniswapXEnabled, userSelectedProtocols, v4SwapAllowed, arbUniswapXAllowed])
}

export function useUniswapXPriorityOrderFlag(chainId?: UniverseChainId): boolean {
  const flagName = UNISWAP_PRIORITY_ORDERS_CHAIN_FLAG_MAP[chainId ?? UniverseChainId.Base]
  const result = useFeatureFlag(flagName ?? FeatureFlags.UniswapXPriorityOrdersBase)

  if (!chainId) {
    return false
  }

  if (!flagName) {
    return false
  }

  return result
}

// These are primarily OP stack chains, since only Priority Orders can only operate on chains with Priority Gas Auctions (PGA)
const UNISWAP_PRIORITY_ORDERS_CHAIN_FLAG_MAP: Partial<Record<UniverseChainId, FeatureFlags>> = {
  [UniverseChainId.Base]: FeatureFlags.UniswapXPriorityOrdersBase,
  [UniverseChainId.Optimism]: FeatureFlags.UniswapXPriorityOrdersOptimism,
  [UniverseChainId.Unichain]: FeatureFlags.UniswapXPriorityOrdersUnichain,
}
