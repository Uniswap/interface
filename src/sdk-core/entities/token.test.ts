import { Token } from './token'

describe('Token', () => {
  const ADDRESS_ONE = '0x0000000000000000000000000000000000000001'
  const ADDRESS_TWO = '0x0000000000000000000000000000000000000002'

  describe('#constructor', () => {
    it('fails with invalid address', () => {
      expect(() => new Token(3, '0xhello00000000000000000000000000000000002', 18).address).toThrow(
        '0xhello00000000000000000000000000000000002 is not a valid address'
      )
    })
    it('fails with negative decimals', () => {
      expect(() => new Token(3, ADDRESS_ONE, -1).address).toThrow('DECIMALS')
    })
    it('fails with 256 decimals', () => {
      expect(() => new Token(3, ADDRESS_ONE, 256).address).toThrow('DECIMALS')
    })
    it('fails with non-integer decimals', () => {
      expect(() => new Token(3, ADDRESS_ONE, 1.5).address).toThrow('DECIMALS')
    })
  })

  describe('#equals', () => {
    it('fails if address differs', () => {
      expect(new Token(1, ADDRESS_ONE, 18).equals(new Token(1, ADDRESS_TWO, 18))).toBe(false)
    })

    it('false if chain id differs', () => {
      expect(new Token(3, ADDRESS_ONE, 18).equals(new Token(1, ADDRESS_ONE, 18))).toBe(false)
    })

    it('true if only decimals differs', () => {
      expect(new Token(1, ADDRESS_ONE, 9).equals(new Token(1, ADDRESS_ONE, 18))).toBe(true)
    })

    it('true if address is the same', () => {
      expect(new Token(1, ADDRESS_ONE, 18).equals(new Token(1, ADDRESS_ONE, 18))).toBe(true)
    })

    it('true on reference equality', () => {
      const token = new Token(1, ADDRESS_ONE, 18)
      expect(token.equals(token)).toBe(true)
    })

    it('true even if name/symbol/decimals differ', () => {
      const tokenA = new Token(1, ADDRESS_ONE, 9, 'abc', 'def')
      const tokenB = new Token(1, ADDRESS_ONE, 18, 'ghi', 'jkl')
      expect(tokenA.equals(tokenB)).toBe(true)
    })
  })
})
