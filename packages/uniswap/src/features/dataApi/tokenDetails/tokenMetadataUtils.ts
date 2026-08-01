/**
 * Canonical token metadata shape, adapted from either V2 REST or legacy GraphQL data
 * (see legacyMetadataAdapters.ts). Used by useTokenMetadata.
 */
export interface TokenMetadataData {
  name?: string
  symbol?: string
  logoUrl?: string
  description?: string
  homepageUrl?: string
  twitterName?: string
  isSpam?: boolean
}
