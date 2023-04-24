import { ChainId } from 'src/constants/chains'
import { ExplorerDataType, getExplorerLink } from 'src/utils/linking'

describe(getExplorerLink, () => {
  it('handles null chainId', () => {
    expect(getExplorerLink(null, 'hash', ExplorerDataType.ADDRESS)).toEqual('')
  })

  it('handles Arbtrum special casing', () => {
    expect(getExplorerLink(ChainId.ArbitrumOne, 'hash', ExplorerDataType.TRANSACTION)).toEqual(
      'https://arbiscan.io/tx/hash'
    )
    expect(getExplorerLink(ChainId.ArbitrumOne, 'hash', ExplorerDataType.ADDRESS)).toEqual(
      'https://arbiscan.io/address/hash'
    )
    expect(getExplorerLink(ChainId.ArbitrumOne, 'hash', ExplorerDataType.TOKEN)).toEqual(
      'https://arbiscan.io/address/hash'
    )
    expect(getExplorerLink(ChainId.ArbitrumOne, 'hash', ExplorerDataType.BLOCK)).toEqual(
      'https://arbiscan.io/block/hash'
    )
  })

  it('handles chain with explorer URL', () => {
    expect(getExplorerLink(ChainId.Goerli, 'hash', ExplorerDataType.TRANSACTION)).toEqual(
      'https://goerli.etherscan.io/tx/hash'
    )
  })

  it('handles chain without explorer URL', () => {
    expect(
      getExplorerLink(7878 /**unassigned chainId*/, 'hash', ExplorerDataType.TRANSACTION)
    ).toEqual('https://etherscan.io/tx/hash')
  })

  it('handles Optimism block special case', () => {
    expect(getExplorerLink(ChainId.Optimism, 'hash', ExplorerDataType.BLOCK)).toEqual(
      'https://optimistic.etherscan.io/tx/hash'
    )
  })
})
