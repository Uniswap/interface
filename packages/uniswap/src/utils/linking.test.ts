import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'

describe(getExplorerLink, () => {
  it('handles different link cases', () => {
    expect(getExplorerLink(UniverseChainId.ArbitrumOne, 'hash', ExplorerDataType.TRANSACTION)).toEqual(
      'https://arbiscan.io/tx/hash',
    )
    expect(getExplorerLink(UniverseChainId.Mainnet, 'hash', ExplorerDataType.ADDRESS)).toEqual(
      'https://etherscan.io/address/hash',
    )
    expect(getExplorerLink(UniverseChainId.Polygon, 'hash', ExplorerDataType.TOKEN)).toEqual(
      'https://polygonscan.com/token/hash',
    )
  })

  it('handles chain with explorer URL', () => {
    expect(getExplorerLink(UniverseChainId.Sepolia, 'hash', ExplorerDataType.TRANSACTION)).toEqual(
      'https://sepolia.etherscan.io/tx/hash',
    )
  })

  it('handles Optimism block special case', () => {
    expect(getExplorerLink(UniverseChainId.Optimism, 'hash', ExplorerDataType.BLOCK)).toEqual(
      'https://optimistic.etherscan.io/tx/hash',
    )
  })
})
