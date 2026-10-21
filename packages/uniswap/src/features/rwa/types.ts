import type { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'

export type RWAIssuer = string

/** Issuer slug for registry tokens with no issuer (e.g. commodities); not a real issuer to display. */
export const UNKNOWN_RWA_ISSUER: RWAIssuer = 'unknown'

/** A logo as light- and dark-theme URLs; either may be empty when the backend has no file for that theme. */
export type RWAThemedLogoUrls = {
  light?: string
  dark?: string
}

/**
 * Backend issuer logo sets. Curated sets are drawn per theme; without one the backend fills every slot with the
 * issuer's CoinGecko image, so `grayscale` may still be a color file and callers keep their grayscale filter on.
 */
export type RWAIssuerLogos = {
  color?: RWAThemedLogoUrls
  grayscale?: RWAThemedLogoUrls
}

export type RWAToken = {
  chainId: number
  address: string
  issuer: RWAIssuer
  // Backend-served issuer branding (GetTokenGroup); absent on the v1 ListRwas path.
  issuerDisplayName?: string
  issuerLogoUrl?: string
  issuerLogos?: RWAIssuerLogos
  /** Present when this preferred TDP display token represents an issuer available on multiple chains. */
  networkCount?: number
  // Display data for this specific tokenized asset (e.g. an `XX.on` token), resolved per token by
  // `resolveRwaIssuerDisplay`: from the data-api `Rwa.issuerData` map (keyed by issuer), or asset-level
  // name/symbol/logoUrl for issuer-less entries (e.g. commodities). Always populated — a non-empty issuer
  // missing its `issuerData` entry is dropped during mapping.
  name: string
  symbol: string
  logoUrl: string
}

/** The issuer branding fields of an RWA token, also derivable from GetToken's `issuer` for ungrouped RWAs. */
export type RWAIssuerDisplay = Pick<RWAToken, 'issuer' | 'issuerDisplayName' | 'issuerLogoUrl' | 'issuerLogos'>

export type RWAAsset = {
  symbol: string
  name: string
  icon: string
  tokens: RWAToken[]
  // Display category (stocks/etfs/commodities) from the data-API `categories`, resolved via
  // `getRwaTagCategory`. UNSPECIFIED when the backend hasn't classified the asset.
  category: RwaCategory
}

export type RWAWhitelist = RWAAsset[]
