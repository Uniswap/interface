/**
 * TODO | Toucan: Update these paths once backend endpoints are finalized
 */
export const AUCTION_API_PATHS = {
  getAuctions: '/get-auctions',
  getBidsByWallet: '/get-bids-by-wallet',
  getBidConcentration: '/get-bid-concentration',
  getAuctionDetails: '/get-auction-details',
  getLatestCheckpoint: '/get-latest-checkpoint',
} as const

export type AuctionApiPath = (typeof AUCTION_API_PATHS)[keyof typeof AUCTION_API_PATHS]
