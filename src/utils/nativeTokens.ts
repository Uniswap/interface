import { nativeOnChain } from 'constants/tokens'
import { Chain } from 'graphql/data/__generated__/types-and-hooks'
import { fromGraphQLChain } from 'graphql/data/util'

export function getNativeTokenDBAddress(chain: Chain): string | undefined {
  const pageChainId = fromGraphQLChain(chain)
  if (pageChainId === undefined) {
    return undefined
  }
  switch (chain) {
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
