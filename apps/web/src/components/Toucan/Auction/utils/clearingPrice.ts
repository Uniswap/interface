import type { Checkpoint } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import type { AuctionDetails } from '~/components/Toucan/Auction/store/types'

/**
 * Gets the most up-to-date clearing price from checkpoint data with fallback to auction details.
 *
 * Priority:
 * 1. Checkpoint clearing price (most recent, updated every block)
 * 2. Auction details clearing price (may lag behind)
 * 3. Auction floor price (minimum price, used when clearing price is 0 or unavailable)
 *
 * @param checkpointData - Live checkpoint data from GetLatestCheckpoint endpoint
 * @param auctionDetails - Static auction details from GetAuction endpoint
 * @returns Clearing price in Q96 format, or '0' if no data available
 */
export function getClearingPrice(checkpointData: Checkpoint | null, auctionDetails: AuctionDetails | null): string {
  // First priority: checkpoint clearing price (most up-to-date)
  if (checkpointData?.clearingPrice && checkpointData.clearingPrice !== '0') {
    return checkpointData.clearingPrice
  }

  // Second priority: auction details clearing price
  if (auctionDetails?.clearingPrice && auctionDetails.clearingPrice !== '0') {
    return auctionDetails.clearingPrice
  }

  // Fallback: floor price from auction details
  if (auctionDetails?.floorPrice) {
    return auctionDetails.floorPrice
  }

  return '0'
}
