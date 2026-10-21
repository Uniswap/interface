import type { PlainMessage } from '@bufbuild/protobuf'
import type { Checkpoint } from '@uniswap/client-launches/dist/data/v1/auction_pb'
import type { AuctionDetails, AuctionProgressData } from '~/features/Toucan/Auction/store/types'
import { AuctionCheckpointLoadState, AuctionOutcome, AuctionProgressState } from '~/features/Toucan/Auction/store/types'
import { safeBigInt } from '~/features/Toucan/Auction/utils/safeBigInt'

function getAuctionProgressState({
  currentBlock,
  startBlock,
  endBlock,
}: {
  currentBlock: number | undefined
  startBlock: number | undefined
  endBlock: number | undefined
}): AuctionProgressState {
  if (!currentBlock || !startBlock || !endBlock) {
    return AuctionProgressState.UNKNOWN
  }

  if (currentBlock < startBlock) {
    return AuctionProgressState.NOT_STARTED
  }

  if (currentBlock > endBlock) {
    return AuctionProgressState.ENDED
  }

  return AuctionProgressState.IN_PROGRESS
}

/**
 * Whether the auction has graduated (currencyRaised >= requiredCurrencyRaised), or undefined
 * while either side is absent or malformed — so no caller can read missing data as a shortfall.
 * Both are proto3 strings: an omitted field arrives as `''`, so a falsy check could not tell it
 * apart from a real `'0'`. safeBigInt draws that line.
 *
 * Exported so `useAuctionCheckpointDiagnostics` can ask "is this pair decidable?" against the
 * checkpoint being published this render, rather than against the store's `hasMetThreshold` (which
 * still reflects the previous checkpoint at that point in the commit). Undecidability must mean the
 * same thing in both places or the diagnostic and the outcome drift apart.
 *
 * @param currencyRaised - Currency raised from checkpoint (bigint string)
 * @param requiredCurrencyRaised - Required currency to graduate (bigint string)
 */
export function computeIsGraduated({
  currencyRaised,
  requiredCurrencyRaised,
}: {
  currencyRaised: string | undefined
  requiredCurrencyRaised: string | undefined
}): boolean | undefined {
  const raised = safeBigInt(currencyRaised)
  const required = safeBigInt(requiredCurrencyRaised)
  if (raised === null || required === null) {
    return undefined
  }
  return raised >= required
}

/**
 * Derives the explicit auction outcome. There is no failure flag on-chain or in the API:
 * a failed launch is an ended auction that never graduated.
 */
function computeOutcome({
  state,
  hasMetThreshold,
  checkpointSettledEmpty,
}: {
  state: AuctionProgressState
  hasMetThreshold: boolean | undefined
  checkpointSettledEmpty: boolean
}): AuctionOutcome {
  switch (state) {
    case AuctionProgressState.UNKNOWN:
      return AuctionOutcome.UNKNOWN
    case AuctionProgressState.ENDED:
      if (hasMetThreshold !== undefined) {
        return hasMetThreshold ? AuctionOutcome.GRADUATED : AuctionOutcome.FAILED
      }
      // Threshold undecided. A *settled* checkpoint is authoritative about its own emptiness: the
      // response arrived and carried no checkpoint, so this ended auction never raised anything
      // and genuinely failed. In flight is not authoritative (wait), and neither is an error —
      // GetLatestCheckpoint 404s on an address it can't resolve to an auction, and calling that a
      // failed launch is exactly the false accusation this function exists to avoid. Both keep
      // UNKNOWN; the error is logged in useAuctionCheckpointDiagnostics so it isn't a silent wait.
      return checkpointSettledEmpty ? AuctionOutcome.FAILED : AuctionOutcome.UNKNOWN
    default:
      // Graduation can latch before the end block; the outcome stays ACTIVE until the auction ends.
      return AuctionOutcome.ACTIVE
  }
}

/**
 * Computes all auction progress information from current block, auction details, and checkpoint data
 * This is a pure function that can be tested independently of the store
 * @param params - Object containing current block, auction details, and checkpoint data
 * @param params.currentBlock - The current block number
 * @param params.auctionDetails - The auction details containing start/end blocks and amount
 * @param params.checkpointData - Live checkpoint data containing totalCleared for graduation
 * @param params.checkpointLoadState - Whether the checkpoint request has settled. Required, not
 *   defaulted: an omitted load state would silently read as "still loading" and strand an ended
 *   auction on UNKNOWN forever, which is the failure mode this parameter was added to close.
 * @returns Computed auction progress state and derived values
 */
export function computeAuctionProgress({
  currentBlock,
  auctionDetails,
  checkpointData,
  checkpointLoadState,
}: {
  currentBlock: number | undefined
  auctionDetails: AuctionDetails | null
  checkpointData: PlainMessage<Checkpoint> | null
  checkpointLoadState: AuctionCheckpointLoadState
}): AuctionProgressData {
  const startBlockNum = auctionDetails?.startBlock ? Number(auctionDetails.startBlock) : undefined
  const endBlockNum = auctionDetails?.endBlock ? Number(auctionDetails.endBlock) : undefined

  const state = getAuctionProgressState({
    currentBlock,
    startBlock: startBlockNum,
    endBlock: endBlockNum,
  })

  let blocksRemaining: number | undefined
  let progressPercentage: number | undefined

  if (currentBlock && startBlockNum !== undefined && endBlockNum !== undefined) {
    if (state === AuctionProgressState.IN_PROGRESS) {
      blocksRemaining = endBlockNum - currentBlock
      const totalBlocks = endBlockNum - startBlockNum
      const elapsedBlocks = currentBlock - startBlockNum
      progressPercentage = totalBlocks > 0 ? Math.min(100, (elapsedBlocks / totalBlocks) * 100) : 0
    }
  }

  // Graduation occurs when currencyRaised >= requiredCurrencyRaised; undefined until both load.
  const hasMetThreshold = computeIsGraduated({
    currencyRaised: checkpointData?.currencyRaised,
    requiredCurrencyRaised: auctionDetails?.requiredCurrencyRaised,
  })

  const checkpointSettledEmpty = checkpointLoadState === AuctionCheckpointLoadState.Success && !checkpointData

  return {
    state,
    blocksRemaining,
    progressPercentage,
    hasMetThreshold,
    // Undecided collapses to false here (fail closed for the boolean consumers); `hasMetThreshold`
    // and `outcome` are the fields that distinguish undecided from genuinely below target.
    isGraduated: hasMetThreshold === true,
    outcome: computeOutcome({ state, hasMetThreshold, checkpointSettledEmpty }),
  }
}
