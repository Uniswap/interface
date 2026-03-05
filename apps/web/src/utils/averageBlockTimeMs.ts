import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isL2ChainId } from 'uniswap/src/features/chains/utils'
import {
  AVERAGE_L1_BLOCK_TIME_MS,
  AVERAGE_L2_BLOCK_TIME_MS,
} from 'uniswap/src/features/transactions/hooks/usePollingIntervalByChain'

/**
 * Returns the accurate chain-specific block time for timestamp calculations.
 * Use this for countdown timers, block-to-time conversions, and other timestamp calculations.
 */
export function getAverageBlockTimeMs(chainId?: UniverseChainId | number): number {
  if (!chainId) {
    return AVERAGE_L2_BLOCK_TIME_MS
  }
  const chainInfo = getChainInfo(chainId as UniverseChainId)
  return chainInfo.blockTimeMs ?? AVERAGE_L2_BLOCK_TIME_MS
}

/**
 * Returns a generic L1/L2 polling interval for data refetch operations.
 * Use this for API polling intervals where exact chain-specific times aren't needed.
 * - L1 chains: 12 seconds
 * - L2 chains: 3 seconds
 */
export function getPollingIntervalMs(chainId?: UniverseChainId | number): number {
  if (!chainId) {
    return AVERAGE_L2_BLOCK_TIME_MS
  }
  return isL2ChainId(chainId as UniverseChainId) ? AVERAGE_L2_BLOCK_TIME_MS : AVERAGE_L1_BLOCK_TIME_MS
}
