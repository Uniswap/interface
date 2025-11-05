import { useEffect, useState } from 'react'
import { EVMUniverseChainId } from 'uniswap/src/features/chains/types'
import { isMainnetChainId } from 'uniswap/src/features/chains/utils'
import {
  AVERAGE_L1_BLOCK_TIME_MS,
  AVERAGE_L2_BLOCK_TIME_MS,
} from 'uniswap/src/features/transactions/hooks/usePollingIntervalByChain'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { useBlock } from 'wagmi'

/**
 * Hook that provides a countdown timer until the next block
 * Calculates time remaining based on current block timestamp and average block time for the chain
 * @param chainId - The EVM chain ID to track blocks for
 * @returns The number of seconds remaining until the next block (estimated)
 */
export function useBlockCountdown(chainId: EVMUniverseChainId | undefined): number | undefined {
  const [countdown, setCountdown] = useState<number | undefined>(undefined)

  const { data: currentBlock } = useBlock({ chainId })
  const currentBlockTimestamp = currentBlock?.timestamp

  useEffect(() => {
    if (!chainId || !currentBlockTimestamp) {
      setCountdown(undefined)
      return
    }

    const averageBlockTimeMs = isMainnetChainId(chainId) ? AVERAGE_L1_BLOCK_TIME_MS : AVERAGE_L2_BLOCK_TIME_MS
    const averageBlockTimeSeconds = averageBlockTimeMs / ONE_SECOND_MS
    const blockTimestamp = Number(currentBlockTimestamp)

    const calculateCountdown = () => {
      const now = Math.floor(Date.now() / ONE_SECOND_MS)
      const elapsedSinceBlock = now - blockTimestamp
      const remaining = averageBlockTimeSeconds - (elapsedSinceBlock % averageBlockTimeSeconds)

      // Ensure countdown cycles from max to 1 (never show 0)
      return remaining < 1 ? averageBlockTimeSeconds : remaining
    }

    setCountdown(calculateCountdown())

    const interval = setInterval(() => {
      setCountdown(calculateCountdown())
    }, ONE_SECOND_MS)

    // eslint-disable-next-line consistent-return
    return () => {
      clearInterval(interval)
    }
  }, [chainId, currentBlockTimestamp])

  return countdown
}
