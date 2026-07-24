/**
 * Configuration overrides for Toucan auction parameters
 */
export {
  DEFAULT_VERIFIED_AUCTION_IDS,
  getAuctionMetadata,
  isTradingRestrictedUntilTge,
  type AuctionMetadataOverride,
} from 'uniswap/src/features/toucan/auctionMetadata'

/**
 * Redemption override for an auction whose auctioned token is a virtual ERC-20
 * (`IVirtualERC20`) that is now redeemable for a real, tradeable token.
 *
 * This is a deliberate, curated frontend override used until the backend serves redemption
 * state on the `Auction` type. The real token address is NOT stored here — it is read on-chain
 * from the virtual token's `UNDERLYING_TOKEN_ADDRESS()` (see `useAuctionRedemption`). The
 * presence of an entry both (a) flags the auction as "ready to redeem" and (b) guards the
 * on-chain call so we never invoke `UNDERLYING_TOKEN_ADDRESS()` on a non-virtual token.
 */
export interface AuctionRedemptionConfig {
  /** External page where holders redeem the virtual token for the real one. */
  redeemUrl: string
}

/**
 * Redemption overrides keyed by the auctioned (virtual) token: "{chainId}-{tokenAddress}".
 * This is the token address (`auctionDetails.tokenAddress` / the `/explore/tokens/...` address),
 * NOT the auction contract address that appears in the `/explore/auctions/...` URL.
 * Add an entry here when a virtual-token auction becomes redeemable.
 */
const AUCTION_REDEMPTION_OVERRIDES: Record<string, AuctionRedemptionConfig> = {
  // rCAP -> CAP. Auctioned token (rCAP) 0x9999...9999; auction contract is 0x20eEBd...cd24.
  '1-0x9999b7e3cc6979223ff1af980b7d8b90b75d9999': {
    redeemUrl: 'https://redeem.caplabslimited.com/',
  },
}

/**
 * Get redemption config for an auction's virtual token from config overrides.
 * Returns undefined when the auction is not in the redeemable state.
 */
export function getAuctionRedemptionConfig({
  chainId,
  tokenAddress,
}: {
  chainId: number
  tokenAddress: string
}): AuctionRedemptionConfig | undefined {
  const key = `${chainId}-${tokenAddress.toLowerCase()}`
  return AUCTION_REDEMPTION_OVERRIDES[key]
}
