// TODO | Toucan: remove these types once they can be auto-generated
export interface GetBidsByWalletRequest {
  wallet_id: string
  auction_id?: string
  page_size?: number
  page_token?: string
}

export interface Bid {
  bid_id: string
  auction_id: string
  wallet_id: string
  tx_hash: string
  tokens_allocated: string
  max_price: string
  created_at: string
  status: string
  starting_block: string
  base_currency_spent: string
  base_currency_initial: string
}

export interface GetBidsByWalletResponse {
  bids: Bid[]
  next_page_token?: string
}

export interface GetBidConcentrationRequest {
  auction_id: string
}

export interface GetBidConcentrationResponse {
  /**
   * Map of tick_price -> volume
   * Represents the distribution of auction bids at all ticks
   */
  bid_concentration: Record<string, string>
}

export interface Auction {
  auction_id: string
  chain_id: number
  token_symbol: string
  token_address: string
  token_name: string
  creator_address: string
  start_block: string
  end_block: string
  total_supply: string
  tick_size: string
  graduation_threshold_mps: string
  bid_token_address: string
}

export interface GetAuctionDetailsRequest {
  auction_id: string
}

export interface GetAuctionDetailsResponse {
  auction: Auction
}

export interface GetAuctionsRequest {
  page_size?: number
  page_token?: string
}

export interface GetAuctionsResponse {
  auctions: Auction[]
  next_page_token?: string
}

export interface GetLatestCheckpointRequest {
  auction_id: string
}

export interface GetLatestCheckpointResponse {
  clearing_price: string
  cumulative_mps: string
}
