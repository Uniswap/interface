import { Ether, Token } from './index'

describe('Currency', () => {
  const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000'
  const ADDRESS_ONE = '0x0000000000000000000000000000000000000001'

  const t0 = new Token(1, ADDRESS_ZERO, 18)
  const t1 = new Token(1, ADDRESS_ONE, 18)

  describe('#equals', () => {
    it('ether on same chains is ether', () => {
      expect(Ether.onChain(1).equals(Ether.onChain(1)))
    })
    it('ether is not token0', () => {
      expect(Ether.onChain(1).equals(t0)).toStrictEqual(false)
    })
    it('token1 is not token0', () => {
      expect(t1.equals(t0)).toStrictEqual(false)
    })
    it('token0 is token0', () => {
      expect(t0.equals(t0)).toStrictEqual(true)
    })
    it('token0 is equal to another token0', () => {
      expect(t0.equals(new Token(1, ADDRESS_ZERO, 18, 'symbol', 'name'))).toStrictEqual(true)
    })
  })
})
