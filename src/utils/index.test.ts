import { AddressZero } from '@ethersproject/constants'
import { TokenAmount, Token, ChainId } from '@uniswap/sdk'

import { getEtherscanLink, calculateSlippageAmount } from '.'

describe('utils', () => {
  describe('#getEtherscanLink', () => {
    it('correct for tx', () => {
      expect(getEtherscanLink(1, 'abc', 'transaction')).toEqual('https://etherscan.io/tx/abc')
    })
    it('correct for address', () => {
      expect(getEtherscanLink(1, 'abc', 'address')).toEqual('https://etherscan.io/address/abc')
    })
  })

  describe('#calculateSlippageAmount', () => {
    it('bounds are correct', () => {
      const tokenAmount = new TokenAmount(new Token(ChainId.MAINNET, AddressZero, 0), '100')
      expect(() => calculateSlippageAmount(tokenAmount, -1)).toThrow()
      expect(calculateSlippageAmount(tokenAmount, 0).map(bound => bound.toString())).toEqual(['100', '100'])
      expect(calculateSlippageAmount(tokenAmount, 100).map(bound => bound.toString())).toEqual(['99', '101'])
      expect(calculateSlippageAmount(tokenAmount, 200).map(bound => bound.toString())).toEqual(['98', '102'])
      expect(calculateSlippageAmount(tokenAmount, 10000).map(bound => bound.toString())).toEqual(['0', '200'])
      expect(() => calculateSlippageAmount(tokenAmount, 10001)).toThrow()
    })
  })
})
