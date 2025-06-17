import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'

describe(getExplorerLink, () => {
  it('handles different link cases', () => {
    expect(
      getExplorerLink({ chainId: UniverseChainId.ArbitrumOne, data: 'hash', type: ExplorerDataType.TRANSACTION }),
    ).toEqual('https://arbiscan.io/tx/hash')
    expect(getExplorerLink({ chainId: UniverseChainId.Mainnet, data: 'hash', type: ExplorerDataType.ADDRESS })).toEqual(
      'https://etherscan.io/address/hash',
    )
    expect(getExplorerLink({ chainId: UniverseChainId.Polygon, data: 'hash', type: ExplorerDataType.TOKEN })).toEqual(
      'https://polygonscan.com/token/hash',
    )
  })

  it('handles chain with explorer URL', () => {
    expect(
      getExplorerLink({ chainId: UniverseChainId.Sepolia, data: 'hash', type: ExplorerDataType.TRANSACTION }),
    ).toEqual('https://sepolia.etherscan.io/tx/hash')
  })

  it('handles Optimism block special case', () => {
    expect(getExplorerLink({ chainId: UniverseChainId.Optimism, data: 'hash', type: ExplorerDataType.BLOCK })).toEqual(
      'https://optimistic.etherscan.io/tx/hash',
    )
  })

  it('handles native currency', () => {
    expect(getExplorerLink({ chainId: UniverseChainId.Base, type: ExplorerDataType.NATIVE })).toEqual(
      'https://basescan.org/',
    )
  })

  it('returns prefix if no data', () => {
    expect(getExplorerLink({ chainId: UniverseChainId.Base, type: ExplorerDataType.ADDRESS })).toEqual(
      'https://basescan.org/',
    )
    expect(getExplorerLink({ chainId: UniverseChainId.Base, type: ExplorerDataType.TOKEN })).toEqual(
      'https://basescan.org/',
    )
    expect(getExplorerLink({ chainId: UniverseChainId.Base, type: ExplorerDataType.BLOCK })).toEqual(
      'https://basescan.org/',
    )
    expect(getExplorerLink({ chainId: UniverseChainId.Base, type: ExplorerDataType.TRANSACTION })).toEqual(
      'https://basescan.org/',
    )
    expect(getExplorerLink({ chainId: UniverseChainId.Base, type: ExplorerDataType.NFT })).toEqual(
      'https://basescan.org/',
    )
  })
})
