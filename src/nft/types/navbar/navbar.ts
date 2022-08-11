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
  coinGeckoId: string
  priceUsd: number
  price24hChange: number
  volume24h: number
  onDefaultList?: boolean
  marketCap: number
}
