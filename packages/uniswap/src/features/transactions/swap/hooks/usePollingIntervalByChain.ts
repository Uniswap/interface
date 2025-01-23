import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isMainnetChainId } from 'uniswap/src/features/chains/utils'
import { DynamicConfigs, SwapConfigKey } from 'uniswap/src/features/gating/configs'
import { useDynamicConfigValue } from 'uniswap/src/features/gating/hooks'
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

  return isMainnetChainId(chainId) ? averageL1BlockTimeMs : averageL2BlockTimeMs
}
