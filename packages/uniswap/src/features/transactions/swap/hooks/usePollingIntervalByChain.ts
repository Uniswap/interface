import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isMainnetChainId } from 'uniswap/src/features/chains/utils'
import { DynamicConfigs, SwapConfigKey } from 'uniswap/src/features/gating/configs'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useDynamicConfigValue, useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

export const AVERAGE_L1_BLOCK_TIME_MS = 12 * ONE_SECOND_MS
const AVERAGE_L2_BLOCK_TIME_MS = 3 * ONE_SECOND_MS

export function usePollingIntervalByChain(chainId?: UniverseChainId): number {
  const averageL1BlockTimeMs = useDynamicConfigValue(
    DynamicConfigs.Swap,
    SwapConfigKey.AverageL1BlockTimeMs,
    AVERAGE_L1_BLOCK_TIME_MS,
  )

  const averageL2BlockTimeMs = useDynamicConfigValue(
    DynamicConfigs.Swap,
    SwapConfigKey.AverageL2BlockTimeMs,
    AVERAGE_L2_BLOCK_TIME_MS,
  )

  const monadTestnetPollingIntervalMs = useDynamicConfigValue(
    DynamicConfigs.Swap,
    SwapConfigKey.MonadTestnetPollingIntervalMs,
    AVERAGE_L2_BLOCK_TIME_MS,
  )

  // TODO(WEB-6132): remove this flag once short term experiment is complete
  const enableTwoSecondInterval = useFeatureFlag(FeatureFlags.TwoSecondSwapQuotePollingInterval)
  const l2PollingInterval = enableTwoSecondInterval ? 2 * ONE_SECOND_MS : averageL2BlockTimeMs

  // Remove this dynamic config once Monad RPC latency issues are resolved
  if (chainId === UniverseChainId.MonadTestnet) {
    return monadTestnetPollingIntervalMs
  }
  return isMainnetChainId(chainId) ? averageL1BlockTimeMs : l2PollingInterval
}
