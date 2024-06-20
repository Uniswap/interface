import { Token } from '../token'
import { CurrencyAmount } from './currencyAmount'
import { Price } from './price'

describe('Price', () => {
  const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000'
  const ADDRESS_ONE = '0x0000000000000000000000000000000000000001'

  const t0 = new Token(1, ADDRESS_ZERO, 18)
  const t0_6 = new Token(1, ADDRESS_ZERO, 6)
  const t1 = new Token(1, ADDRESS_ONE, 18)

  describe('#constructor', () => {
    it('array format works', () => {
      const price = new Price(t0, t1, 1, 54321)
      expect(price.toSignificant(5)).toEqual('54321')
      expect(price.baseCurrency.equals(t0))
      expect(price.quoteCurrency.equals(t1))
    })
    it('object format works', () => {
      const price = new Price({
        baseAmount: CurrencyAmount.fromRawAmount(t0, 1),
        quoteAmount: CurrencyAmount.fromRawAmount(t1, 54321),
      })
      expect(price.toSignificant(5)).toEqual('54321')
      expect(price.baseCurrency.equals(t0))
      expect(price.quoteCurrency.equals(t1))
    })
  })

  describe('#quote', () => {
    it('returns correct value', () => {
      const price = new Price(t0, t1, 1, 5)
      expect(price.quote(CurrencyAmount.fromRawAmount(t0, 10))).toEqual(CurrencyAmount.fromRawAmount(t1, 50))
    })
  })

  describe('#toSignificant', () => {
    it('no decimals', () => {
      const p = new Price(t0, t1, 123, 456)
      expect(p.toSignificant(4)).toEqual('3.707')
    })
    it('no decimals flip ratio', () => {
      const p = new Price(t0, t1, 456, 123)
      expect(p.toSignificant(4)).toEqual('0.2697')
    })
    it('with decimal difference', () => {
      const p = new Price(t0_6, t1, 123, 456)
      expect(p.toSignificant(4)).toEqual('0.000000000003707')
    })
    it('with decimal difference flipped', () => {
      const p = new Price(t0_6, t1, 456, 123)
      expect(p.toSignificant(4)).toEqual('0.0000000000002697')
    })
    it('with decimal difference flipped base quote flipped', () => {
      const p = new Price(t1, t0_6, 456, 123)
      expect(p.toSignificant(4)).toEqual('269700000000')
    })
  })
})
