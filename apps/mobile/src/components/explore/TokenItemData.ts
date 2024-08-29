import { WalletChainId } from 'uniswap/src/types/chains'

export type TokenItemData = {
  name: string
  logoUrl: string
  chainId: WalletChainId
  address: Address | null
  symbol: string
  price?: number
  marketCap?: number
  pricePercentChange24h?: number
  volume24h?: number
  totalValueLocked?: number
}
