import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { SafetyLevel } from 'graphql/data/__generated__/types-and-hooks'
import { SearchToken } from 'graphql/data/SearchTokens'
import { CHAIN_NAME_TO_CHAIN_ID } from 'graphql/data/util'

export interface LooksRareRewardsData {
  address: string
  cumulativeLooksAmount: string
  cumulativeLooksProof: string[]
}

export interface FungibleToken {
  name: string
  address: string
  symbol: string
  decimals: number
  chainId: number
  logoURI?: string | null
  priceUsd?: number | null
  price24hChange?: number | null
  volume24h?: number | null
  isVerified?: boolean
}

export function parseFungibleTokens(tokens: SearchToken[]) {
  const fungibleTokens: FungibleToken[] = []
  tokens.forEach((token) => {
    if (token.name && token.symbol && token.decimals && token.chain && (token.address || token.standard === 'NATIVE')) {
      // Consider both default & extended list tokens as verified, as there are more "verified" nfts than tokens on the default list
      const isVerified =
        token.project?.safetyLevel == SafetyLevel.Verified || token.project?.safetyLevel == SafetyLevel.MediumWarning
      fungibleTokens.push({
        ...token,
        name: token.name,
        symbol: token.symbol,
        decimals: token.decimals,
        address: token.address ?? NATIVE_CHAIN_ID,
        chainId: CHAIN_NAME_TO_CHAIN_ID[token.chain],
        priceUsd: token.market?.price?.value ?? undefined,
        price24hChange: token.market?.pricePercentChange?.value,
        volume24h: token.market?.volume24H?.value,
        logoURI: token.project?.logoUrl,
        isVerified,
      })
    }
  })
  return fungibleTokens
}
