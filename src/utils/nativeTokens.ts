import { nativeOnChain } from 'constants/tokens'
import { Chain } from 'graphql/data/__generated__/types-and-hooks'
import { supportedChainIdFromGQLChain } from 'graphql/data/util'

export function getNativeTokenDBAddress(chain: Chain): string | undefined {
  const pageChainId = supportedChainIdFromGQLChain(chain)
  if (pageChainId === undefined) {
    return undefined
  }
  switch (chain) {
    // Celo & Polygon have precompiles for their native tokens
    case Chain.Celo:
    case Chain.Polygon:
      return nativeOnChain(pageChainId).wrapped.address
    case Chain.Ethereum:
    case Chain.Arbitrum:
    case Chain.EthereumGoerli:
    case Chain.Optimism:
    default:
      return undefined
  }
}
