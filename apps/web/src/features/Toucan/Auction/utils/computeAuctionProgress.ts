import type { PlainMessage } from '@bufbuild/protobuf'
import type { Checkpoint } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import type { AuctionDetails, AuctionProgressData } from '~/features/Toucan/Auction/store/types'
import { AuctionOutcome, AuctionProgressState } from '~/features/Toucan/Auction/store/types'

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
 * Computes whether the auction has graduated (required currency raised)
 * Graduation occurs when currencyRaised >= requiredCurrencyRaised
 * @param currencyRaised - Currency raised from checkpoint (bigint string)
 * @param requiredCurrencyRaised - Required currency to graduate (bigint string)
 * @returns Whether the auction has graduated
 */
function computeIsGraduated({
  currencyRaised,
  requiredCurrencyRaised,
}: {
  currencyRaised: string | undefined
  requiredCurrencyRaised: string | undefined
}): boolean {
  if (!currencyRaised || !requiredCurrencyRaised) {
    return false
  }
  try {
    return BigInt(currencyRaised) >= BigInt(requiredCurrencyRaised)
  } catch {
    return false
  }
}

/**
 * Derives the explicit auction outcome. There is no failure flag on-chain or in the API:
 * a failed launch is an ended auction that never graduated.
 */
function computeOutcome({ state, isGraduated }: { state: AuctionProgressState; isGraduated: boolean }): AuctionOutcome {
  switch (state) {
    case AuctionProgressState.UNKNOWN:
      return AuctionOutcome.UNKNOWN
    case AuctionProgressState.ENDED:
      return isGraduated ? AuctionOutcome.GRADUATED : AuctionOutcome.FAILED
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
 * @returns Computed auction progress state and derived values
 */
export function computeAuctionProgress({
  currentBlock,
  auctionDetails,
  checkpointData,
}: {
  currentBlock: number | undefined
  auctionDetails: AuctionDetails | null
  checkpointData: PlainMessage<Checkpoint> | null
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

  // Graduation occurs when currencyRaised >= requiredCurrencyRaised
  const isGraduated = computeIsGraduated({
    currencyRaised: checkpointData?.currencyRaised,
    requiredCurrencyRaised: auctionDetails?.requiredCurrencyRaised,
  })

  return {
    state,
    blocksRemaining,
    progressPercentage,
    isGraduated,
    outcome: computeOutcome({ state, isGraduated }),
  }
}
