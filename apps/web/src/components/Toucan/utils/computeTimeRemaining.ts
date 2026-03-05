import { PlainMessage } from '@bufbuild/protobuf'
import type { Auction } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import { getAverageBlockTimeMs } from '~/utils/averageBlockTimeMs'

/**
 * Computes milliseconds remaining for an auction by estimating block timestamps
 * relative to the auction's creation time.
 *
 * This is used for sorting auctions by time remaining in the TopAuctionsTable.
 * For display purposes, use useAuctionTimeRemaining hook instead which provides
 * real-time updates with actual block timestamps.
 *
 * @param auction - Auction data with startBlock, endBlock, creationBlock, createdAt, chainId
 * @param currentTime - Current time in milliseconds (Date.now())
 * @returns Milliseconds remaining until auction start/end, or undefined if data is invalid
 */
export function computeTimeRemaining(auction: PlainMessage<Auction>, currentTime: number): number | undefined {
  try {
    // Validate required fields
    if (!auction.startBlock || !auction.endBlock || !auction.creationBlock || !auction.createdAt) {
      return undefined
    }

    // Parse creation timestamp from ISO string
    const creationTimestamp = new Date(auction.createdAt).getTime()
    if (isNaN(creationTimestamp)) {
      return undefined
    }

    // Get block numbers
    const creationBlock = Number(auction.creationBlock)
    const startBlock = Number(auction.startBlock)
    const endBlock = Number(auction.endBlock)

    // Determine average block time based on chain type
    const averageBlockTimeMs = getAverageBlockTimeMs(auction.chainId)

    // Estimate start and end timestamps
    const startBlockDiff = startBlock - creationBlock
    const endBlockDiff = endBlock - creationBlock

    const startTimestamp = creationTimestamp + startBlockDiff * averageBlockTimeMs
    const endTimestamp = creationTimestamp + endBlockDiff * averageBlockTimeMs

    // Return milliseconds until start if not started, otherwise milliseconds until end
    if (currentTime < startTimestamp) {
      return startTimestamp - currentTime
    }

    if (currentTime >= endTimestamp) {
      return 0
    }

    return endTimestamp - currentTime
  } catch (_error) {
    return undefined
  }
}
