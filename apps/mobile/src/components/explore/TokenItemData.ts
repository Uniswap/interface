import { UniverseChainId } from '@universe/chains'
import type { TokenColorOverrides } from '@universe/mycelium'

export type TokenItemData = {
  name: string
  logoUrl: string
  colorOverrides?: TokenColorOverrides
  chainId: UniverseChainId
  address: Address | null
  symbol: string
  price?: number
  marketCap?: number
  pricePercentChange24h?: number
  volume24h?: number
  totalValueLocked?: number
  networkCount?: number
}
