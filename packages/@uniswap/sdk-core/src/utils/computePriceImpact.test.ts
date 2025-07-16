import { CurrencyAmount, Ether, Percent, Price, Token } from '../entities'
import { computePriceImpact } from './computePriceImpact'

describe('#computePriceImpact', () => {
  const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000'
  const ADDRESS_ONE = '0x0000000000000000000000000000000000000001'

  const t0 = new Token(1, ADDRESS_ZERO, 18)
  const t1 = new Token(1, ADDRESS_ONE, 18)

  it('is correct for zero', () => {
    expect(
      computePriceImpact(
        new Price(Ether.onChain(1), t0, 10, 100),
        CurrencyAmount.fromRawAmount(Ether.onChain(1), 10),
        CurrencyAmount.fromRawAmount(t0, 100)
      )
    ).toEqual(new Percent(0, 10000))
  })
  it('is correct for half output', () => {
    expect(
      computePriceImpact(
        new Price(t0, t1, 10, 100),
        CurrencyAmount.fromRawAmount(t0, 10),
        CurrencyAmount.fromRawAmount(t1, 50)
      )
    ).toEqual(new Percent(5000, 10000))
  })
  it('is negative for more output', () => {
    expect(
      computePriceImpact(
        new Price(t0, t1, 10, 100),
        CurrencyAmount.fromRawAmount(t0, 10),
        CurrencyAmount.fromRawAmount(t1, 200)
      )
    ).toEqual(new Percent(-10000, 10000))
  })
})
