import type { UniverseChainId } from 'uniswap/src/features/chains/types'

export interface NetworkSelectorOption {
  chainId: UniverseChainId
  label: string
  balanceUSD: number
}

export interface TieredNetworkOptions {
  withBalances: NetworkSelectorOption[]
  otherNetworks: NetworkSelectorOption[]
}
