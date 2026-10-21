import type { UniverseChainId } from '@universe/chains'

export interface NetworkSelectorOption {
  chainId: UniverseChainId
  label: string
  balanceUSD: number
}

export interface TieredNetworkOptions {
  withBalances: NetworkSelectorOption[]
  otherNetworks: NetworkSelectorOption[]
}
