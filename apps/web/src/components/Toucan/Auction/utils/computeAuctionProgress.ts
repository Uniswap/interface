import type { AuctionDetails, AuctionProgressData } from 'components/Toucan/Auction/store/types'
import { AuctionProgressState } from 'components/Toucan/Auction/store/types'

function getAuctionProgressState({
  currentBlock,
  startBlock,
  endBlock,
}: {
  currentBlock: bigint | number | undefined
  startBlock: number | undefined
  endBlock: number | undefined
}): AuctionProgressState {
  if (!currentBlock || !startBlock || !endBlock) {
    return AuctionProgressState.NOT_STARTED
  }

  const current = typeof currentBlock === 'bigint' ? Number(currentBlock) : currentBlock

  if (current < startBlock) {
    return AuctionProgressState.NOT_STARTED
  }

  if (current > endBlock) {
    return AuctionProgressState.ENDED
  }

  return AuctionProgressState.IN_PROGRESS
}

/**
 * Computes all auction progress information from current block and auction details
 * This is a pure function that can be tested independently of the store
 * @param params - Object containing current block and auction details
 * @param params.currentBlock - The current block number
 * @param params.auctionDetails - The auction details containing start/end blocks
 * @returns Computed auction progress state and derived values
 */
export function computeAuctionProgress({
  currentBlock,
  auctionDetails,
}: {
  currentBlock: bigint | undefined
  auctionDetails: AuctionDetails | null
}): AuctionProgressData {
  const state = getAuctionProgressState({
    currentBlock,
    startBlock: auctionDetails?.startBlock,
    endBlock: auctionDetails?.endBlock,
  })

  let blocksRemaining: number | undefined
  let progressPercentage: number | undefined

  if (currentBlock && auctionDetails) {
    const current = Number(currentBlock)
    const { startBlock, endBlock } = auctionDetails

    if (state === AuctionProgressState.IN_PROGRESS) {
      blocksRemaining = endBlock - current
      const totalBlocks = endBlock - startBlock
      const elapsedBlocks = current - startBlock
      // TODO | Toucan: if progress is percentage sold rather than blocks passed, this needs to be updated
      progressPercentage = totalBlocks > 0 ? Math.min(100, (elapsedBlocks / totalBlocks) * 100) : 0
    }
  }

  // TODO | Toucan: update with graduation logic once schema from back end has been decided on
  const isGraduated = false

  return {
    state,
    blocksRemaining,
    progressPercentage,
    isGraduated,
  }
}
