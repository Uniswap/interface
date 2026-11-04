/**
 * Configuration overrides for Toucan auction parameters
 */
export {
  getAuctionMetadata,
  isTradingRestrictedUntilTge,
  type AuctionMetadataOverride,
} from 'uniswap/src/features/toucan/auctionMetadata'

/** Key builder for the curated override maps below: "{chainId}-{address}". */
function buildOverrideKey({ chainId, address }: { chainId: number; address: string }): string {
  // oxlint-disable-next-line universe-custom/no-tolowercase-address-currencyid -- Keep this dependency-free: functions/utils/getAuction.ts imports it into the server bundle, and normalizeTokenAddressForCache's import graph does not belong there.
  return `${chainId}-${address.toLowerCase()}`
}

/**
 * Trading tokens for receipts that do not expose IVirtualERC20's underlying-token getter.
 * Values are bare addresses on the SAME chain as the key — navigation reuses the auction's
 * chainId. An entry here also wins over the on-chain `UNDERLYING_TOKEN_ADDRESS()` read in
 * `useAuctionTradingToken`, so don't add a token that is also in AUCTION_REDEMPTION_OVERRIDES
 * unless the curated address should replace the read.
 */
const AUCTION_TRADING_TOKEN_OVERRIDES: Record<string, string> = {
  // rIDOS -> IDOS on Arbitrum. rIDOS only tracks auction disbursements.
  // https://docs.idos.network/idos-token-launch/official-links
  '42161-0xb628b89067e8f7dfc2cb528a72bcff7d5cedce29': '0x68731d6f14b827bbcffbebb62b19daa18de1d79c',
}

export function getAuctionTradingTokenOverride({
  chainId,
  tokenAddress,
}: {
  chainId: number
  tokenAddress: string
}): string | undefined {
  return AUCTION_TRADING_TOKEN_OVERRIDES[buildOverrideKey({ chainId, address: tokenAddress })]
}

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
  return AUCTION_REDEMPTION_OVERRIDES[buildOverrideKey({ chainId, address: tokenAddress })]
}
