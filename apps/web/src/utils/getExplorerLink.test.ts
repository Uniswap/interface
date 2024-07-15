import { UniverseChainId } from 'uniswap/src/types/chains'
import { ExplorerDataType, getExplorerLink } from 'utils/getExplorerLink'

describe('#getExplorerLink', () => {
  it('correct for tx', () => {
    expect(getExplorerLink(1, 'abc', ExplorerDataType.TRANSACTION)).toEqual('https://etherscan.io/tx/abc')
  })
  it('correct for token', () => {
    expect(getExplorerLink(1, 'abc', ExplorerDataType.TOKEN)).toEqual('https://etherscan.io/token/abc')
  })
  it('correct for address', () => {
    expect(getExplorerLink(1, 'abc', ExplorerDataType.ADDRESS)).toEqual('https://etherscan.io/address/abc')
  })
  it('unrecognized chain id defaults to mainnet', () => {
    expect(getExplorerLink(2, 'abc', ExplorerDataType.ADDRESS)).toEqual('https://etherscan.io/address/abc')
  })
  it('arbitrum', () => {
    expect(getExplorerLink(42161, 'abc', ExplorerDataType.ADDRESS)).toEqual('https://arbiscan.io/address/abc')
  })
  it('bnb chain', () => {
    expect(getExplorerLink(UniverseChainId.Bnb, 'abc', ExplorerDataType.ADDRESS)).toEqual(
      'https://bscscan.com/address/abc',
    )
  })
  it('polygon', () => {
    expect(getExplorerLink(137, 'abc', ExplorerDataType.ADDRESS)).toEqual('https://polygonscan.com/address/abc')
  })
  it('celo', () => {
    expect(getExplorerLink(42220, 'abc', ExplorerDataType.ADDRESS)).toEqual('https://celoscan.io/address/abc')
  })
  it('goerli', () => {
    expect(getExplorerLink(5, 'abc', ExplorerDataType.ADDRESS)).toEqual('https://goerli.etherscan.io/address/abc')
  })
  it('avalanche', () => {
    expect(getExplorerLink(UniverseChainId.Avalanche, 'abc', ExplorerDataType.ADDRESS)).toEqual(
      'https://snowtrace.io/address/abc',
    )
  })
  it('base', () => {
    expect(getExplorerLink(UniverseChainId.Base, 'abc', ExplorerDataType.ADDRESS)).toEqual(
      'https://basescan.org/address/abc',
    )
  })
  it('blast', () => {
    expect(getExplorerLink(UniverseChainId.Blast, 'abc', ExplorerDataType.ADDRESS)).toEqual(
      'https://blastscan.io/address/abc',
    )
  })
})
