import { UniverseChainId } from 'uniswap/src/features/chains/types'

export type TokenItemData = {
  name: string
  logoUrl: string
  chainId: UniverseChainId
  address: Address | null
  symbol: string
  price?: number
  marketCap?: number
  pricePercentChange24h?: number
  volume24h?: number
  totalValueLocked?: number
}
