import {
  deriveBlocks,
  deriveConvexAuctionSteps,
  getBlockTimeSeconds,
  isLauncherSdkError,
} from '@uniswap/liquidity-launcher-sdk'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

export enum EmissionScheduleError {
  WindowTooShort = 'window_too_short',
  Overshoot = 'overshoot',
}

/**
 * Validates the auction window against the liquidity-launcher SDK's emission-schedule generator —
 * the same `deriveConvexAuctionSteps` the backend forwards — so the wizard catches the two configs
 * the backend would reject before submit:
 *  - too few blocks span the window (`INVALID_AUCTION_WINDOW`) → {@link EmissionScheduleError.WindowTooShort}
 *  - per-block rounding overshoots the supply budget (`INVALID_EMISSION_SCHEDULE`) → {@link EmissionScheduleError.Overshoot}
 *
 * Returns the rejection reason, or `undefined` when the window is valid (or inputs are incomplete,
 * which other validation already blocks). Pure — pass `nowMs` to keep callers deterministic.
 */
export function getAuctionEmissionScheduleError({
  startTime,
  endTime,
  chainId,
  nowMs = Date.now(),
}: {
  startTime: Date | undefined
  endTime: Date | undefined
  chainId: UniverseChainId | undefined
  nowMs?: number
}): EmissionScheduleError | undefined {
  if (!startTime || !endTime || chainId === undefined || endTime.getTime() <= startTime.getTime()) {
    return undefined
  }

  const blockTimeSeconds = getBlockTimeSeconds(chainId)
  const nowUnix = BigInt(Math.floor(nowMs / 1000))
  const startTimeUnix = BigInt(Math.floor(startTime.getTime() / 1000))
  const endTimeUnix = BigInt(Math.floor(endTime.getTime() / 1000))

  try {
    // The schedule depends only on the block span (`endBlock - startBlock`), and `timeToBlock` is
    // linear in `currentBlock`, so a fixed `0n` keeps this a pure, RPC-free pre-validation.
    const { startBlock, endBlock } = deriveBlocks({
      startTimeUnix,
      endTimeUnix,
      currentBlock: 0n,
      nowUnix,
      blockTimeSeconds,
    })
    deriveConvexAuctionSteps(startBlock, endBlock)
    return undefined
  } catch (error) {
    if (isLauncherSdkError(error)) {
      switch (error.code) {
        case 'INVALID_EMISSION_SCHEDULE':
          return EmissionScheduleError.Overshoot
        case 'INVALID_AUCTION_WINDOW':
          return EmissionScheduleError.WindowTooShort
        default:
          // INVALID_TIME (start already passed) is surfaced by the dedicated start-time validation.
          return undefined
      }
    }
    throw error
  }
}
