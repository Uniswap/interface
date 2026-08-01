/**
 * Metadata overrides for auction projects.
 * All fields are optional; consumers should fall back to API token metadata.
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
 */
const AUCTION_METADATA_OVERRIDES: Record<string, AuctionMetadataOverride> = {
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
  '1-0xe172e9b6cfbeeb5593bdce3f077356fdb33af904': {
    logoUrl: '/images/logos/fold-token-launch-logo.jpeg',
    tradingRestrictedUntilTge: true,
    tgeTimestamp: 1787149535, // 2026-08-19T14:25:35Z
  },
  '42161-0x170f6e39ea851108f0713090467871f28a62a5d4': {
    logoUrl: '/images/logos/boardwalk-token-launch-logo.png',
  },
  // Boardwalk (BWLK) — Ethereum mainnet auction token
  '1-0xf9a352b7c7b62a852e5c8a64a455246dd9596461': {
    logoUrl: '/images/logos/bwlk-token-launch-logo.png',
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

function parseOverrideKey(key: string): AuctionMetadataOverrideKey | undefined {
  const separatorIndex = key.indexOf('-')
  if (separatorIndex === -1) {
    return undefined
  }

  const chainId = Number(key.slice(0, separatorIndex))
  const tokenAddress = key.slice(separatorIndex + 1)
  if (!Number.isInteger(chainId) || !tokenAddress) {
    return undefined
  }

  return { chainId, tokenAddress }
}

/**
 * Find auctions whose overridden name/symbol matches the search query.
 * Lets users search by the display name/symbol we override even when the
 * backend only indexes the original token metadata.
 */
export function findAuctionOverrideMatches(query: string): Array<{ chainId: number; tokenAddress: string }> {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) {
    return []
  }

  const matches: Array<{ chainId: number; tokenAddress: string }> = []
  for (const [key, override] of Object.entries(AUCTION_METADATA_OVERRIDES)) {
    const name = override.tokenName?.toLowerCase() ?? ''
    const symbol = override.tokenSymbol?.toLowerCase() ?? ''
    if (name.includes(normalizedQuery) || symbol.includes(normalizedQuery)) {
      const parsed = parseOverrideKey(key)
      if (parsed) {
        matches.push(parsed)
      }
    }
  }
  return matches
}

export const DEFAULT_VERIFIED_AUCTION_IDS = [
  '8453_0x7e867b47a94df05188c08575e8B9a52F3F69c469',
  '1_0x9084CB9a700a52909Cbef3113dB8BaC01C01EfD6',
  '42161_0xc27F8a94Df88C4f57B09067e07EA6bC11CA47e11',
  '1_0xb3079Ec6b82f22A1ABfDCA1A22659aB07Cdf2f0F',
  '1_0xfFDab1083fCbBCEE32997795388B3D61Ebab786E',
  '1_0x20eEBd78151EAe9Ed2380AC613204aaF5CA0cd24',
  '1_0x687Cc38d8279dF3352b64cF3EC1fe8e033933595', // Interfold (FOLD)
  '1_0x74D1fbC555D8888b0AD87f5822dD1666498459e4', // Boardwalk (BWLK)
]
