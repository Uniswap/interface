/* eslint-disable rulesdir/no-undefined-or */
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { useUniswapXPriorityOrderFlag } from 'uniswap/src/features/transactions/swap/utils/protocols'

/**
 * Returns true if the chain is supported by UniswapX. Does not differentiate between UniswapX v1 and v2.
 */
export function useIsUniswapXSupportedChain(chainId?: number) {
  const isDutchV3Enabled = useFeatureFlag(FeatureFlags.ArbitrumDutchV3)
  const isPriorityOrdersEnabled = useUniswapXPriorityOrderFlag(chainId)

  return (
    chainId === UniverseChainId.Mainnet ||
    (isDutchV3Enabled && chainId === UniverseChainId.ArbitrumOne) ||
    isPriorityOrdersEnabled
  )
}
