/* eslint-disable rulesdir/no-undefined-or */
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ArbitrumXV2ExperimentGroup, Experiments } from 'uniswap/src/features/gating/experiments'
import { useExperimentGroupName } from 'uniswap/src/features/gating/hooks'
import { useUniswapXPriorityOrderFlag } from 'uniswap/src/features/transactions/swap/utils/protocols'

/**
 * Returns true if the chain is supported by UniswapX. Does not differentiate between UniswapX v1 and v2.
 */
export function useIsUniswapXSupportedChain(chainId?: number) {
  const xv2ArbitrumEnabled =
    useExperimentGroupName(Experiments.ArbitrumXV2OpenOrders) === ArbitrumXV2ExperimentGroup.Test
  const isPriorityOrdersEnabled = useUniswapXPriorityOrderFlag(chainId)

  return (
    chainId === UniverseChainId.Mainnet ||
    (xv2ArbitrumEnabled && chainId === UniverseChainId.ArbitrumOne) ||
    isPriorityOrdersEnabled
  )
}
