import { isMainnetChainId } from 'uniswap/src/features/chains/utils'
import { DynamicConfigs, SwapConfigKey } from 'uniswap/src/features/gating/configs'
import { useDynamicConfigValue } from 'uniswap/src/features/gating/hooks'
import { UniverseChainId } from 'uniswap/src/types/chains'

const FALLBACK_L1_BLOCK_TIME_MS = 12000
const FALLBACK_L2_BLOCK_TIME_MS = 3000

export function usePollingIntervalByChain(chainId?: UniverseChainId): number {
  const averageL1BlockTimeMs = useDynamicConfigValue(
    DynamicConfigs.Swap,
    SwapConfigKey.AverageL1BlockTimeMs,
    FALLBACK_L1_BLOCK_TIME_MS,
  )

  const averageL2BlockTimeMs = useDynamicConfigValue(
    DynamicConfigs.Swap,
    SwapConfigKey.AverageL2BlockTimeMs,
    FALLBACK_L2_BLOCK_TIME_MS,
  )

  return isMainnetChainId(chainId) ? averageL1BlockTimeMs : averageL2BlockTimeMs
}
