import { anonymizeLink } from './anonymizeLink'

describe('#anonymizeLink', () => {
  it('does nothing to non-urls', () => {
    expect(anonymizeLink('not a link')).toEqual('not a link')
  })
  it('anonymizes any addresses in etherscan urls', () => {
    expect(anonymizeLink('https://etherscan.io/address/0xabcd')).toEqual('https://etherscan.io/address/***')
  })
  it('anonymizes any addresses in etherscan urls', () => {
    expect(anonymizeLink('https://etherscan.io/address/0xabcd')).toEqual('https://etherscan.io/address/***')
  })
  it('anonymizes any addresses in testnet etherscan urls', () => {
    expect(anonymizeLink('https://rinkeby.etherscan.io/address/0xabcd')).toEqual(
      'https://rinkeby.etherscan.io/address/***'
    )
  })
  it('anonymizes any addresses in testnet etherscan urls', () => {
    expect(anonymizeLink('https://ropsten.etherscan.io/address/0xabcd')).toEqual(
      'https://ropsten.etherscan.io/address/***'
    )
  })
  it('anonymizes hashes in the middle of the url', () => {
    expect(anonymizeLink('https://ropsten.etherscan.io/address/0xabcd/test')).toEqual(
      'https://ropsten.etherscan.io/address/***/test'
    )
  })
  it('does not anonymize 0x', () => {
    expect(anonymizeLink('https://ropsten.etherscan.io/address/0x/test')).toEqual(
      'https://ropsten.etherscan.io/address/0x/test'
    )
  })
  it('works for arbitrum urls', () => {
    expect(anonymizeLink('https://arbiscan.io/0x/0xabc')).toEqual('https://arbiscan.io/0x/***')
  })
  it('works for arbitrum rinkeby urls', () => {
    expect(anonymizeLink('https://rinkeby-explorer.arbitrum.io/0x/0xabc')).toEqual(
      'https://rinkeby-explorer.arbitrum.io/0x/***'
    )
  })
})
