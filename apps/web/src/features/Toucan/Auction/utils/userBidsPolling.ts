import { parseNonNegativeBigInt } from '~/features/Toucan/Auction/utils/safeBigInt'

/** The ADP's existing allowance for indexing to catch up after the auction ends. */
const USER_BIDS_POST_AUCTION_POLLING_BUFFER_BLOCKS = 200n

export function getUserBidsPollingEndBlock(endBlock: string | undefined): bigint | null {
  const parsedEndBlock = parseNonNegativeBigInt(endBlock)
  return parsedEndBlock === null ? null : parsedEndBlock + USER_BIDS_POST_AUCTION_POLLING_BUFFER_BLOCKS
}
