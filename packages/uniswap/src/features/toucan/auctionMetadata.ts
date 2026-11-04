/**
 * Metadata overrides for auction projects.
 * All fields are optional; consumers should fall back to API token metadata.
 */
export interface AuctionMetadataOverride {
  launchedByName?: string
  description?: string
  website?: string
  twitter?: string
  tokenName?: string
  tokenSymbol?: string
  tradingRestrictedUntilTge?: boolean
  /** TGE time (unix seconds). When set with `tradingRestrictedUntilTge`, the restriction lifts automatically at this time. */
  tgeTimestamp?: number
}

interface AuctionMetadataOverrideKey {
  chainId: number
  tokenAddress: string
}

/**
 * Metadata overrides for specific auction tokens.
 * Key format: "{chainId}-{tokenAddress}".
 *
 * Don't add an override here for a value the backend overrides: set it in Mission Control
 * instead, and the auction API serves it already applied. A key's value replaces the
 * backend's in-code defaults wholesale, so an edit must list every override still wanted.
 * - "% committed to LP" (`percentCommittedToLp`): `auction_lp_percent_overrides`
 * - Token logo (`tokenImageUrl`): `auction_token_logo_overrides`, as an `ipfs://` URL
 */
const AUCTION_METADATA_OVERRIDES: Record<string, AuctionMetadataOverride> = {
  // Octra (OCT): the indexed token reads "Wrapped OCT" / "wOCT"
  '1-0x4647e1fe715c9e23959022c2416c71867f5a6e80': {
    tokenName: 'Octra',
    tokenSymbol: 'OCT',
  },
  // Strato
  '1-0x4c93b9fbf7fd1777ccbcbc538b1d0a8b58fb1ad6': {
    tradingRestrictedUntilTge: true,
  },
  // Interfold (FOLD)
  '1-0xe172e9b6cfbeeb5593bdce3f077356fdb33af904': {
    tradingRestrictedUntilTge: true,
    tgeTimestamp: 1787149535, // 2026-08-19T14:25:35Z
  },
}

/**
 * Get metadata for an auction from config overrides.
 * Returns undefined if no override exists for the given auction.
 */
export function getAuctionMetadata({
  chainId,
  tokenAddress,
}: AuctionMetadataOverrideKey): AuctionMetadataOverride | undefined {
  const key = buildOverrideKey({ chainId, tokenAddress })
  return AUCTION_METADATA_OVERRIDES[key]
}

/**
 * Whether trading of the auctioned token is currently restricted until its TGE.
 * When the override sets `tgeTimestamp`, the restriction lifts automatically once that time passes.
 */
export function isTradingRestrictedUntilTge({ chainId, tokenAddress }: AuctionMetadataOverrideKey): boolean {
  const metadata = getAuctionMetadata({ chainId, tokenAddress })
  if (!metadata?.tradingRestrictedUntilTge) {
    return false
  }
  return metadata.tgeTimestamp === undefined || Date.now() < metadata.tgeTimestamp * 1000
}

function buildOverrideKey({ chainId, tokenAddress }: AuctionMetadataOverrideKey): string {
  // oxlint-disable-next-line universe-custom/no-tolowercase-address-currencyid -- Keep this Cloudflare worker dependency-free.
  return `${chainId}-${tokenAddress.toLowerCase()}`
}

export const DEFAULT_VERIFIED_AUCTION_IDS = [
  '8453_0x7e867b47a94df05188c08575e8B9a52F3F69c469',
  '1_0x9084CB9a700a52909Cbef3113dB8BaC01C01EfD6',
  '42161_0xc27F8a94Df88C4f57B09067e07EA6bC11CA47e11',
  '1_0xb3079Ec6b82f22A1ABfDCA1A22659aB07Cdf2f0F',
  '1_0xfFDab1083fCbBCEE32997795388B3D61Ebab786E',
  '1_0x20eEBd78151EAe9Ed2380AC613204aaF5CA0cd24',
  '1_0x687Cc38d8279dF3352b64cF3EC1fe8e033933595', // Interfold (FOLD)
  '1_0xfA63c5B9220a7f0D21e156490eC0b296838e6605', // Interfold (FOLD) — second CCA
  '1_0x74D1fbC555D8888b0AD87f5822dD1666498459e4', // Boardwalk (BWLK)
  '1_0xA93807cD89A99bB564C7A887ab49Cc4EcC3c9226', // Balances (BALANCE)
]
