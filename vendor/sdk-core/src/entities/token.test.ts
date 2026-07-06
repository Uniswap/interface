import { Token } from './token'
import { BigNumber } from '@ethersproject/bignumber'

describe('Token', () => {
  const ADDRESS_ONE = '0x0000000000000000000000000000000000000001'
  const ADDRESS_TWO = '0x0000000000000000000000000000000000000002'
  const DAI_MAINNET = '0x6B175474E89094C44Da98b954EedeAC495271d0F'

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
    it('fails with negative FOT fees', () => {
      expect(
        () => new Token(3, ADDRESS_ONE, 18, undefined, undefined, undefined, BigNumber.from(-1), undefined)
      ).toThrow('NON-NEGATIVE FOT FEES')
      expect(
        () => new Token(3, ADDRESS_ONE, 18, undefined, undefined, undefined, undefined, BigNumber.from(-1))
      ).toThrow('NON-NEGATIVE FOT FEES')
    })
  })

  describe('#constructor with bypassChecksum = true', () => {
    const bypassChecksum = true

    it('creates the token with a valid address', () => {
      expect(new Token(3, ADDRESS_TWO, 18, undefined, undefined, bypassChecksum).address).toBe(ADDRESS_TWO)
    })
    it('fails with invalid address', () => {
      expect(
        () =>
          new Token(3, '0xhello00000000000000000000000000000000002', 18, undefined, undefined, bypassChecksum).address
      ).toThrow('0xhello00000000000000000000000000000000002 is not a valid address')
    })
    it('fails with negative decimals', () => {
      expect(() => new Token(3, ADDRESS_ONE, -1, undefined, undefined, bypassChecksum).address).toThrow('DECIMALS')
    })
    it('fails with 256 decimals', () => {
      expect(() => new Token(3, ADDRESS_ONE, 256, undefined, undefined, bypassChecksum).address).toThrow('DECIMALS')
    })
    it('fails with non-integer decimals', () => {
      expect(() => new Token(3, ADDRESS_ONE, 1.5, undefined, undefined, bypassChecksum).address).toThrow('DECIMALS')
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

    it('true even if one token is checksummed and the other is not', () => {
      const tokenA = new Token(1, DAI_MAINNET, 18, 'DAI', undefined, false)
      const tokenB = new Token(1, DAI_MAINNET.toLowerCase(), 18, 'DAI', undefined, true)
      expect(tokenA.equals(tokenB)).toBe(true)
    })
  })
})
