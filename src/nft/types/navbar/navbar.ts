import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { checkWarning } from 'constants/tokenSafety'
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
  onDefaultList?: boolean
}

export function parseFungibleToken(tokens: SearchToken[]) {
  return tokens.map(
    (t): FungibleToken => ({
      ...t,
      name: t.name ?? '',
      symbol: t.symbol ?? '',
      decimals: t.decimals ?? 0,
      address: t.address ?? NATIVE_CHAIN_ID,
      chainId: CHAIN_NAME_TO_CHAIN_ID[t?.chain],
      priceUsd: t.market?.price?.value ?? undefined,
      price24hChange: t.market?.pricePercentChange?.value,
      volume24h: t.market?.volume24H?.value,
      onDefaultList: t.address ? !checkWarning(t.address) : true,
      logoURI: t.project?.logoUrl,
    })
  )
}
