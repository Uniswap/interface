import { ChainId, Token } from '../src'

describe('Token', () => {
  const ADDRESS_ONE = '0x0000000000000000000000000000000000000001'
  const ADDRESS_TWO = '0x0000000000000000000000000000000000000002'

  describe('#equals', () => {
    it('fails if address differs', () => {
      expect(new Token(ChainId.MAINNET, ADDRESS_ONE, 18).equals(new Token(ChainId.MAINNET, ADDRESS_TWO, 18))).toBe(
        false
      )
    })

    it('false if chain id differs', () => {
      expect(new Token(ChainId.ROPSTEN, ADDRESS_ONE, 18).equals(new Token(ChainId.MAINNET, ADDRESS_ONE, 18))).toBe(
        false
      )
    })

    it('true if only decimals differs', () => {
      expect(new Token(ChainId.MAINNET, ADDRESS_ONE, 9).equals(new Token(ChainId.MAINNET, ADDRESS_ONE, 18))).toBe(true)
    })

    it('true if address is the same', () => {
      expect(new Token(ChainId.MAINNET, ADDRESS_ONE, 18).equals(new Token(ChainId.MAINNET, ADDRESS_ONE, 18))).toBe(true)
    })

    it('true on reference equality', () => {
      const token = new Token(ChainId.MAINNET, ADDRESS_ONE, 18)
      expect(token.equals(token)).toBe(true)
    })

    it('true even if name/symbol/decimals differ', () => {
      const tokenA = new Token(ChainId.MAINNET, ADDRESS_ONE, 9, 'abc', 'def')
      const tokenB = new Token(ChainId.MAINNET, ADDRESS_ONE, 18, 'ghi', 'jkl')
      expect(tokenA.equals(tokenB)).toBe(true)
    })
  })
})
