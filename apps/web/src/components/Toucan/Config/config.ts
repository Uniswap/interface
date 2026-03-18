/**
 * Configuration overrides for Toucan auction parameters
 */

/**
 * Total supply overrides for specific auction tokens
 * Key format: "{chainId}-{tokenAddress}"
 * Value: Total supply as a string (to handle large numbers)
 *
 * Use this to override the total supply returned by the API for specific auctions
 * where the on-chain data differs from what's expected.
 */
const TOTAL_SUPPLY_OVERRIDES: Record<string, string> = {
  // Example: '1-0x1234567890123456789012345678901234567890': '1000000000000000000000000',
}

/**
 * Helper function to get the override key for an auction
 */
function getTotalSupplyOverrideKey(chainId: number, tokenAddress: string): string {
  return `${chainId}-${tokenAddress.toLowerCase()}`
}

/**
 * Get the total supply for an auction, using override if available
 */
export function getTotalSupply({
  chainId,
  tokenAddress,
  apiTotalSupply,
}: {
  chainId: number
  tokenAddress: string
  apiTotalSupply: string
}): string {
  const overrideKey = getTotalSupplyOverrideKey(chainId, tokenAddress)
  if (overrideKey in TOTAL_SUPPLY_OVERRIDES) {
    return TOTAL_SUPPLY_OVERRIDES[overrideKey]
  }
  return apiTotalSupply
}

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
  '1-0xcccc87d42db3d35018ecae712a0bc53e79d9cccc': {
    logoUrl: '/images/logos/cap-token-launch-logo.png',
  },
  '42161-0xb628b89067e8f7dfc2cb528a72bcff7d5cedce29': {
    logoUrl: '/images/logos/idos-token-launch-logo.svg',
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
]
