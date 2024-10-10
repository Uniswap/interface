import { useMemo } from 'react'
import { ProtocolItems } from 'uniswap/src/data/tradingApi/__generated__'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { UniverseChainId } from 'uniswap/src/types/chains'

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
  const priorityOrdersAllowed = useFeatureFlag(FeatureFlags.UniswapXPriorityOrders) && chainId === UniverseChainId.Base
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
