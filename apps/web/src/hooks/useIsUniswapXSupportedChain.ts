/* eslint-disable rulesdir/no-undefined-or */
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ArbitrumXV2ExperimentGroup, Experiments } from 'uniswap/src/features/gating/experiments'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useExperimentGroupName, useFeatureFlag } from 'uniswap/src/features/gating/hooks'

export function useIsUniswapXSupportedChain(chainId?: number) {
  const xv2ArbitrumEnabled =
    useExperimentGroupName(Experiments.ArbitrumXV2OpenOrders) === ArbitrumXV2ExperimentGroup.Test
  const isPriorityOrdersEnabled = useFeatureFlag(FeatureFlags.UniswapXPriorityOrders)

  return (
    chainId === UniverseChainId.Mainnet ||
    (xv2ArbitrumEnabled && chainId === UniverseChainId.ArbitrumOne) ||
    (isPriorityOrdersEnabled && chainId === UniverseChainId.Base) // UniswapX priority orders are only available on Base for now
  )
}
