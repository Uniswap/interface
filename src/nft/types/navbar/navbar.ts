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
  logoURI: string
  priceUsd?: number | null
  price24hChange?: number | null
  volume24h?: number | null
  onDefaultList?: boolean
}
