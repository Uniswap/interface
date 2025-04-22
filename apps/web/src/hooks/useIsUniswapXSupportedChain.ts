/* eslint-disable rulesdir/no-undefined-or */
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ArbitrumXV2SamplingProperties, Experiments } from 'uniswap/src/features/gating/experiments'
import { useExperimentValue } from 'uniswap/src/features/gating/hooks'
import { useUniswapXPriorityOrderFlag } from 'uniswap/src/features/transactions/swap/utils/protocols'

/**
 * Returns true if the chain is supported by UniswapX. Does not differentiate between UniswapX v1 and v2.
 */
export function useIsUniswapXSupportedChain(chainId?: number) {
  const xv2ArbitrumRoutingType = useExperimentValue<
    Experiments.ArbitrumXV2Sampling,
    ArbitrumXV2SamplingProperties.RoutingType,
    'CLASSIC' | 'DUTCH_V2' | 'DUTCH_V3'
  >(Experiments.ArbitrumXV2Sampling, ArbitrumXV2SamplingProperties.RoutingType, 'CLASSIC')
  const isPriorityOrdersEnabled = useUniswapXPriorityOrderFlag(chainId)

  return (
    chainId === UniverseChainId.Mainnet ||
    (xv2ArbitrumRoutingType !== 'CLASSIC' && chainId === UniverseChainId.ArbitrumOne) ||
    isPriorityOrdersEnabled
  )
}
