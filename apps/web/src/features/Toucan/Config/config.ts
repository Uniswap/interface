/**
 * Configuration overrides for Toucan auction parameters
 */

/**
 * Metadata override for auction projects.
 * All fields are optional - if not provided, the corresponding UI section will be hidden.
 */
export interface AuctionMetadataOverride {
  launchedByName?: string
  description?: string
  website?: string
  twitter?: string
  logoUrl?: string
  tokenName?: string
  tokenSymbol?: string
  tradingRestrictedUntilTge?: boolean
}

/**
 * Metadata overrides for specific auction tokens
 * Key format: "{chainId}-{tokenAddress}"
 *
 * Use this to provide project metadata for specific auctions.
 * If no override exists for an auction, the corresponding UI sections will be hidden.
 */
const AUCTION_METADATA_OVERRIDES: Record<string, AuctionMetadataOverride> = {
  // Example:
  // '1-0x1234567890123456789012345678901234567890': {
  //   launchedByName: 'FooCorp',
  //   description: 'Token description...',
  //   website: 'https://example.com',
  //   twitter: 'https://x.com/example',
  // },
  '8453-0xa53887f7e7c1bf5010b8627f1c1ba94fe7a5d6e0': {
    logoUrl: '/images/logos/rainbow-token-launch-logo.png',
  },
  '1-0x9999b7e3cc6979223ff1af980b7d8b90b75d9999': {
    logoUrl: '/images/logos/cap-token-launch-logo.png',
  },
  '42161-0xb628b89067e8f7dfc2cb528a72bcff7d5cedce29': {
    logoUrl: '/images/logos/idos-token-launch-logo.svg',
  },
  '1-0x4647e1fe715c9e23959022c2416c71867f5a6e80': {
    logoUrl: '/images/logos/octra-token-launch-logo.svg',
    tokenName: 'Octra',
    tokenSymbol: 'OCT',
  },
  '1-0x4c93b9fbf7fd1777ccbcbc538b1d0a8b58fb1ad6': {
    logoUrl: '/images/logos/strato-token-launch-logo.jpeg',
    tradingRestrictedUntilTge: true,
  },
}

/**
 * Get metadata for an auction from config overrides.
 * Returns undefined if no override exists for the given auction.
 */
export function getAuctionMetadata({
  chainId,
  tokenAddress,
}: {
  chainId: number
  tokenAddress: string
}): AuctionMetadataOverride | undefined {
  const key = `${chainId}-${tokenAddress.toLowerCase()}`
  return AUCTION_METADATA_OVERRIDES[key]
}

export const DEFAULT_VERIFIED_AUCTION_IDS = [
  '8453_0x7e867b47a94df05188c08575e8B9a52F3F69c469',
  '1_0x9084CB9a700a52909Cbef3113dB8BaC01C01EfD6',
  '42161_0xc27F8a94Df88C4f57B09067e07EA6bC11CA47e11',
  '1_0xb3079Ec6b82f22A1ABfDCA1A22659aB07Cdf2f0F',
  '1_0xfFDab1083fCbBCEE32997795388B3D61Ebab786E',
  '1_0x20eEBd78151EAe9Ed2380AC613204aaF5CA0cd24',
]
