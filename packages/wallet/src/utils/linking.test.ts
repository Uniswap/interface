import { UniverseChainId } from 'uniswap/src/types/chains'
import { ExplorerDataType, getExplorerLink } from 'wallet/src/utils/linking'

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
    expect(getExplorerLink(UniverseChainId.PolygonMumbai, 'hash', ExplorerDataType.BLOCK)).toEqual(
      'https://mumbai.polygonscan.com/block/hash',
    )
  })

  it('handles chain with explorer URL', () => {
    expect(getExplorerLink(UniverseChainId.Goerli, 'hash', ExplorerDataType.TRANSACTION)).toEqual(
      'https://goerli.etherscan.io/tx/hash',
    )
  })

  it('handles Optimism block special case', () => {
    expect(getExplorerLink(UniverseChainId.Optimism, 'hash', ExplorerDataType.BLOCK)).toEqual(
      'https://optimistic.etherscan.io/tx/hash',
    )
  })
})
