import { ChainId } from '@uniswap/sdk-core'
import { Chain } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'

export function toGraphQLChain(chainId: ChainId | number): Chain | undefined {
  switch (chainId) {
    case ChainId.MAINNET:
      return Chain.Ethereum
    case ChainId.ARBITRUM_ONE:
      return Chain.Arbitrum
    case ChainId.ARBITRUM_GOERLI:
      return Chain.Arbitrum
    case ChainId.GOERLI:
      return Chain.EthereumGoerli
    case ChainId.SEPOLIA:
      return Chain.EthereumSepolia
    case ChainId.OPTIMISM:
      return Chain.Optimism
    case ChainId.OPTIMISM_GOERLI:
      return Chain.Optimism
    case ChainId.POLYGON:
      return Chain.Polygon
    case ChainId.POLYGON_MUMBAI:
      return Chain.Polygon
    case ChainId.BASE:
      return Chain.Base
    case ChainId.BNB:
      return Chain.Bnb
    case ChainId.AVALANCHE:
      return Chain.Avalanche
    case ChainId.CELO:
      return Chain.Celo
    case ChainId.CELO_ALFAJORES:
      return Chain.Celo
    case ChainId.BLAST:
      return Chain.Blast
  }
  return undefined
}
