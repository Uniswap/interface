import { anonymizeLink } from './anonymizeLink'

describe('#anonymizeLink', () => {
  it('does nothing to non-urls', () => {
    expect(anonymizeLink('not a link')).toEqual('not a link')
  })
  it('anonymizes any addresses in etherscan urls', () => {
    expect(anonymizeLink('https://etherscan.io/address/0xabcd')).toEqual('https://etherscan.io/address/***')
  })
  it('anonymizes any addresses in testnet etherscan urls', () => {
    expect(anonymizeLink('https://goerli.etherscan.io/address/0xabcd')).toEqual(
      'https://goerli.etherscan.io/address/***'
    )
  })
  it('anonymizes hashes in the middle of the url', () => {
    expect(anonymizeLink('https://goerli.etherscan.io/address/0xabcd/test')).toEqual(
      'https://goerli.etherscan.io/address/***/test'
    )
  })
  it('does not anonymize 0x', () => {
    expect(anonymizeLink('https://goerli.etherscan.io/address/0x/test')).toEqual(
      'https://goerli.etherscan.io/address/0x/test'
    )
  })
  it('works for arbitrum urls', () => {
    expect(anonymizeLink('https://arbiscan.io/0x/0xabc')).toEqual('https://arbiscan.io/0x/***')
  })
})
