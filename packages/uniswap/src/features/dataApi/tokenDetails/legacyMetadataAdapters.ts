/**
 * Adapts the legacy TokenProjectWeb/TokenWeb GraphQL token shape into the canonical
 * TokenMetadataData shape (modeled on data.v2.Token), so useTokenMetadata has a single
 * input contract regardless of whether the data came from GraphQL or REST.
 * Delete once the GraphQL path is fully retired.
 */
import type { TokenMetadataData } from 'uniswap/src/features/dataApi/tokenDetails/tokenMetadataUtils'

export interface LegacyTokenMetadataInput {
  name?: string
  symbol?: string
  project?: {
    logoUrl?: string
    description?: string
    homepageUrl?: string
    twitterName?: string
    isSpam?: boolean
  }
}

export function adaptLegacyTokenMetadata(token: LegacyTokenMetadataInput | undefined): TokenMetadataData | undefined {
  if (!token) {
    return undefined
  }
  return {
    name: token.name,
    symbol: token.symbol,
    logoUrl: token.project?.logoUrl,
    description: token.project?.description,
    homepageUrl: token.project?.homepageUrl,
    twitterName: token.project?.twitterName,
    isSpam: token.project?.isSpam,
  }
}
