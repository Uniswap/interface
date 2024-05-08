import { ChainId } from 'wallet/src/constants/chains'
import { ExplorerDataType, getExplorerLink } from 'wallet/src/utils/linking'

describe(getExplorerLink, () => {
  it('handles different link cases', () => {
    expect(getExplorerLink(ChainId.ArbitrumOne, 'hash', ExplorerDataType.TRANSACTION)).toEqual(
      'https://arbiscan.io/tx/hash'
    )
    expect(getExplorerLink(ChainId.Mainnet, 'hash', ExplorerDataType.ADDRESS)).toEqual(
      'https://etherscan.io/address/hash'
    )
    expect(getExplorerLink(ChainId.Polygon, 'hash', ExplorerDataType.TOKEN)).toEqual(
      'https://polygonscan.com/token/hash'
    )
    expect(getExplorerLink(ChainId.PolygonMumbai, 'hash', ExplorerDataType.BLOCK)).toEqual(
      'https://mumbai.polygonscan.com/block/hash'
    )
  })

  it('handles chain with explorer URL', () => {
    expect(getExplorerLink(ChainId.Goerli, 'hash', ExplorerDataType.TRANSACTION)).toEqual(
      'https://goerli.etherscan.io/tx/hash'
    )
  })

  it('handles Optimism block special case', () => {
    expect(getExplorerLink(ChainId.Optimism, 'hash', ExplorerDataType.BLOCK)).toEqual(
      'https://optimistic.etherscan.io/tx/hash'
    )
  })
})
