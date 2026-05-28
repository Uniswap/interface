import { DynamicConfigs, FeatureFlags, SwapConfigKey, useDynamicConfigValue, useFeatureFlag } from '@universe/gating'
import { useCallback } from 'react'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isMainnetChainId } from 'uniswap/src/features/chains/utils'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

export const AVERAGE_L1_BLOCK_TIME_MS = 12 * ONE_SECOND_MS
export const AVERAGE_L2_BLOCK_TIME_MS = 3 * ONE_SECOND_MS

/**
 * Floor of the randomized quote poll interval (see
 * `useQuoteRefetchIntervalForChain` for the full rationale). Together with the
 * chain's default poll interval as a ceiling, this produces a poll cadence in
 * [MIN_QUOTE_POLL_INTERVAL_MS, chainDefault]. The 1s floor keeps the average
 * request rate bounded so we don't spike Trading API load.
 */
export const MIN_QUOTE_POLL_INTERVAL_MS = ONE_SECOND_MS

export function usePollingIntervalByChain(chainId?: UniverseChainId): number {
  const averageL1BlockTimeMs = useDynamicConfigValue({
    config: DynamicConfigs.Swap,
    key: SwapConfigKey.AverageL1BlockTimeMs,
    defaultValue: AVERAGE_L1_BLOCK_TIME_MS,
  })

  const averageL2BlockTimeMs = useDynamicConfigValue({
    config: DynamicConfigs.Swap,
    key: SwapConfigKey.AverageL2BlockTimeMs,
    defaultValue: AVERAGE_L2_BLOCK_TIME_MS,
  })

  const monadTestnetPollingIntervalMs = useDynamicConfigValue({
    config: DynamicConfigs.Swap,
    key: SwapConfigKey.MonadTestnetPollingIntervalMs,
    defaultValue: AVERAGE_L2_BLOCK_TIME_MS,
  })

  // TODO(WEB-6132): remove this flag once short term experiment is complete
  const enableTwoSecondInterval = useFeatureFlag(FeatureFlags.TwoSecondSwapQuotePollingInterval)
  const l2PollingInterval = enableTwoSecondInterval ? 2 * ONE_SECOND_MS : averageL2BlockTimeMs

  // Remove this dynamic config once Monad RPC latency issues are resolved
  if (chainId === UniverseChainId.Monad) {
    return monadTestnetPollingIntervalMs
  }
  return isMainnetChainId(chainId) ? averageL1BlockTimeMs : l2PollingInterval
}

/**
 * Returns a random integer in [minMs, maxMs] (inclusive).
 *
 * Exported for testing; security guarantees are not required — this is used
 * only to vary the cadence of quote polling to obfuscate hard quote timing,
 * not for cryptographic purposes.
 */
export function getRandomPollIntervalMs(minMs: number, maxMs: number): number {
  if (maxMs <= minMs) {
    return minMs
  }
  return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs
}

/**
 * Refetch interval for swap quote polling.
 *
 * - Flag off: returns a fixed number (same as `usePollingIntervalByChain`).
 * - Flag on (`RandomizeQuotePolling`): returns a function that produces a
 *   fresh random interval in [MIN_QUOTE_POLL_INTERVAL_MS, chainDefault] per
 *   call.
 *
 * Randomizing breaks the fixed per-chain poll rhythm (12s mainnet, 2–3s L2s)
 * so a hard quote (RFQ) can't be picked out of soft-quote traffic by timing
 * alone. The chain default is the ceiling (worst-case freshness unchanged);
 * 1s is the floor (bounds Trading API load). See SWAP-2526.
 *
 * Callers must size `staleTime`/`gcTime` from the max interval
 * (`usePollingIntervalByChain`) so we never GC mid-poll.
 */
export function useQuoteRefetchIntervalForChain(chainId?: UniverseChainId): number | (() => number) {
  const basePollingInterval = usePollingIntervalByChain(chainId)
  const enableRandomization = useFeatureFlag(FeatureFlags.RandomizeQuotePolling)

  // `useCallback` keeps the reference stable across renders so React Query
  // does not perceive option changes between polls.
  const randomizedInterval = useCallback(
    () => getRandomPollIntervalMs(MIN_QUOTE_POLL_INTERVAL_MS, basePollingInterval),
    [basePollingInterval],
  )

  return enableRandomization ? randomizedInterval : basePollingInterval
}
