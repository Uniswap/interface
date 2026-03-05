import { getAverageBlockTimeMs } from '~/utils/averageBlockTimeMs'

/**
 * Get the average block time in milliseconds for a given chain.
 * L1 (mainnet) has slower block times than L2 networks.
 */
export function averageBlockTimeMs(chainId: number | undefined): number {
  return getAverageBlockTimeMs(chainId)
}
