import { BigNumberish } from 'ethers'
import { Chain as GQLChain } from 'src/components/PriceChart/__generated__/TokenModel_PriceQuery.graphql'
import { ChainId, TESTNET_CHAIN_IDS } from 'src/constants/chains'
import { Chain } from 'src/data/__generated__/types-and-hooks'

const supportedChains = Object.values(ChainId).map((c) => c.toString())

// Some code from the web app uses chainId types as numbers
// This validates them as coerces into SupportedChainId
export function toSupportedChainId(chainId?: BigNumberish) {
  if (!chainId || !supportedChains.includes(chainId.toString())) {
    return null
  }
  return parseInt(chainId.toString(), 10) as ChainId
}

// variant on `toSupportedChain` with a narrower return type
export function parseActiveChains(activeChainsString: string): ChainId[] {
  return activeChainsString.split(',').map((id) => parseInt(id, 10) as ChainId)
}

export function isTestnet(chainId: ChainId): boolean {
  return TESTNET_CHAIN_IDS.includes(chainId)
}

export function fromGraphQLChain(chain: GQLChain | undefined): ChainId | null {
  switch (chain) {
    case 'ETHEREUM':
      return ChainId.Mainnet
    case 'ARBITRUM':
      return ChainId.ArbitrumOne
    case 'ETHEREUM_GOERLI':
      return ChainId.Goerli
    case 'OPTIMISM':
      return ChainId.Optimism
    case 'POLYGON':
      return ChainId.Polygon
  }

  return null
}

export function toGraphQLChain(chainId: ChainId): Chain | null {
  switch (chainId) {
    case ChainId.Mainnet:
      return Chain.Ethereum
    case ChainId.ArbitrumOne:
      return Chain.Arbitrum
    case ChainId.Goerli:
      return Chain.EthereumGoerli
    case ChainId.Optimism:
      return Chain.Optimism
    case ChainId.Polygon:
      return Chain.Polygon
  }
  return null // TODO: throw error?
}
