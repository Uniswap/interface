import { getEtherscanLink } from './index'

describe('utils', () => {
  describe('#getEtherscanLink', () => {
    it('correct for tx', () => {
      expect(getEtherscanLink(1, 'abc', 'transaction')).toEqual('https://etherscan.io/tx/abc')
    })
    it('correct for address', () => {
      expect(getEtherscanLink(1, 'abc', 'address')).toEqual('https://etherscan.io/address/abc')
    })
  })
})