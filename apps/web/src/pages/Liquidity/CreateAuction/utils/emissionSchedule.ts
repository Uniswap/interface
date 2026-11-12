import {
  deriveBlocks,
  deriveConvexAuctionSteps,
  isLauncherSdkError,
  MPS_TOTAL,
  timeToBlockOnChain,
} from '@uniswap/liquidity-launcher-sdk'
import { UniverseChainId } from '@universe/chains'
import { ONE_DAY_MS } from 'utilities/src/time/time'
import { getAuctionOpenTime, isPreBidRangeValid } from '~/pages/Liquidity/CreateAuction/utils/duration'

export enum EmissionScheduleError {
  WindowTooShort = 'window_too_short',
  WindowTooLong = 'window_too_long',
  Overshoot = 'overshoot',
}

type EmissionScheduleIssue =
  | { error: EmissionScheduleError.WindowTooLong; maxDurationDays: number }
  | { error: EmissionScheduleError.WindowTooShort | EmissionScheduleError.Overshoot }

type EmissionScheduleInput = {
  startTime: Date | undefined
  endTime: Date | undefined
  preBidStartTime?: Date | undefined
  chainId: UniverseChainId | undefined
  nowMs?: number
}

/**
 * Validates the auction window against the liquidity-launcher SDK's emission-schedule generator —
 * the same `deriveConvexAuctionSteps` the backend forwards — so the wizard catches the configs the
 * backend would reject before submit:
 *  - too few blocks span the window (`INVALID_AUCTION_WINDOW`) → {@link EmissionScheduleError.WindowTooShort}
 *  - more emission blocks than `MPS_TOTAL` (`INVALID_EMISSION_SCHEDULE`) → {@link EmissionScheduleError.WindowTooLong},
 *    with the longest emission window, in whole days, that fits
 *  - any other `INVALID_EMISSION_SCHEDULE` → {@link EmissionScheduleError.Overshoot}
 *
 * Returns the rejection reason, or `undefined` when the window is valid (or inputs are incomplete,
 * which other validation already blocks). Pure — pass `nowMs` to keep callers deterministic.
 *
 * `preBidStartTime`, when set, is where the auction actually OPENS: the block span the backend
 * derives runs from there, and the leading `preBidStartTime -> startTime` slice emits nothing.
 * Passing it through keeps this a faithful mirror of the request that will be submitted rather
 * than of a different auction.
 *
 * It does not, today, change the verdict: the wizard adds the pre-bid window in FRONT of the
 * chosen dates, so the ramp still spans `startTime -> endTime` and the `startBlock` terms cancel
 * out of the SDK's `endBlock - startBlock - prebidBlocks - 1`. That equivalence is a property of
 * the current curve, not something the wizard should lean on — the backend derives the schedule
 * from the full window, so this does too. `emissionSchedule.test.ts` pins the equivalence, so a
 * future curve where the pre-bid length does bite turns into a failing test rather than a config
 * that passes here and is rejected at submit.
 */
export function getAuctionEmissionScheduleIssue({
  startTime,
  endTime,
  preBidStartTime,
  chainId,
  nowMs = Date.now(),
}: EmissionScheduleInput): EmissionScheduleIssue | undefined {
  if (!startTime || !endTime || chainId === undefined || endTime.getTime() <= startTime.getTime()) {
    return undefined
  }
  // An out-of-order pre-bid start is its own validation error (surfaced next to the pickers),
  // not a schedule problem — don't let it reach the SDK as a negative prebid window.
  if (!isPreBidRangeValid({ startTime, preBidStartTime })) {
    return undefined
  }

  const nowUnix = BigInt(Math.floor(nowMs / 1000))
  // Mirrors the request the backend will receive: the auction opens at the pre-bid start when
  // there is one, and `startTime` becomes the emission boundary inside that window.
  const auctionStartTime = getAuctionOpenTime({ startTime, preBidStartTime })
  const startTimeUnix = BigInt(Math.floor(auctionStartTime.getTime() / 1000))
  const endTimeUnix = BigInt(Math.floor(endTime.getTime() / 1000))
  let emissionBlocks: bigint | undefined

  try {
    // The schedule depends only on the block span (`endBlock - startBlock`), and the time → block
    // conversion is linear in `currentBlock`, so a fixed `0n` keeps this a pure, RPC-free
    // pre-validation. Converting by `chainId` follows the chain's block-time schedule, so a window
    // that crosses a cadence change (Base Denim, 2s → 200ms) gets its real block span.
    const { startBlock, endBlock } = deriveBlocks({
      startTimeUnix,
      endTimeUnix,
      currentBlock: 0n,
      nowUnix,
      chainId,
    })
    const emissionStartBlock = preBidStartTime
      ? timeToBlockOnChain(chainId, BigInt(Math.floor(startTime.getTime() / 1000)), 0n, nowUnix)
      : startBlock
    emissionBlocks = endBlock - emissionStartBlock
    deriveConvexAuctionSteps(startBlock, endBlock, {
      prebidBlocks: emissionStartBlock > startBlock ? emissionStartBlock - startBlock : 0n,
    })
    return undefined
  } catch (error) {
    if (isLauncherSdkError(error)) {
      switch (error.code) {
        case 'INVALID_EMISSION_SCHEDULE':
          // Every emitting block releases at least 1 mps of the MPS_TOTAL supply, so no schedule
          // fits more blocks than that.
          if (emissionBlocks !== undefined && emissionBlocks > BigInt(MPS_TOTAL)) {
            return {
              error: EmissionScheduleError.WindowTooLong,
              maxDurationDays: getMaxEmissionDurationDays({ startTime, endTime, emissionBlocks }),
            }
          }
          return { error: EmissionScheduleError.Overshoot }
        case 'INVALID_AUCTION_WINDOW':
          return { error: EmissionScheduleError.WindowTooShort }
        default:
          // INVALID_TIME (start already passed) is surfaced by the dedicated start-time validation.
          return undefined
      }
    }
    throw error
  }
}

/** {@link getAuctionEmissionScheduleIssue}, reduced to the rejection reason. */
export function getAuctionEmissionScheduleError(input: EmissionScheduleInput): EmissionScheduleError | undefined {
  return getAuctionEmissionScheduleIssue(input)?.error
}

/**
 * Scales the chosen emission window down to `MPS_TOTAL` blocks at its own average block time. Block
 * times only shorten over time (Base Denim: 2s → 200ms), so the shorter window averages blocks at
 * least this slow and this never overstates the limit.
 */
function getMaxEmissionDurationDays({
  startTime,
  endTime,
  emissionBlocks,
}: {
  startTime: Date
  endTime: Date
  emissionBlocks: bigint
}): number {
  const emissionMs = Math.floor(endTime.getTime() / 1000) * 1000 - Math.floor(startTime.getTime() / 1000) * 1000
  return Math.floor((emissionMs * MPS_TOTAL) / Number(emissionBlocks) / ONE_DAY_MS)
}
