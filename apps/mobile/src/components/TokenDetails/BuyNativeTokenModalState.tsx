import { UniverseChainId } from 'uniswap/src/features/chains/types'

export interface BuyNativeTokenModalState {
  chainId: UniverseChainId
  currencyId: string
}
