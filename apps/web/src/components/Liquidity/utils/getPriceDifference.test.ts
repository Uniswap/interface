import { Currency, Price } from '@uniswap/sdk-core'
import { getPriceDifference } from 'components/Liquidity/utils/getPriceDifference'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { ETH_MAINNET } from 'test-utils/constants'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { USDT } from 'uniswap/src/constants/tokens'

// eslint-disable-next-line max-params
function getInitialPrice(base: Currency, quote: Currency, input: string) {
  const parsedQuoteAmount = tryParseCurrencyAmount(input, quote)
  const baseAmount = tryParseCurrencyAmount('1', base)
  return (
    baseAmount &&
    parsedQuoteAmount &&
    new Price(baseAmount.currency, parsedQuoteAmount.currency, baseAmount.quotient, parsedQuoteAmount.quotient)
  )
}

describe('getPriceDifference', () => {
  const defaultInitialPrice = getInitialPrice(USDT, ETH_MAINNET, '100')

  it('returns undefined when defaultInitialPrice is undefined', () => {
    expect(getPriceDifference({ initialPrice: '100', priceInverted: false })).toBeUndefined()
  })

  it('returns correct price difference for a price diff with no warning', () => {
    expect(getPriceDifference({ initialPrice: '105', defaultInitialPrice, priceInverted: false })).toStrictEqual({
      value: 5,
      absoluteValue: 5,
      warning: undefined,
    })
  })

  it('returns the correct warning for a medium severity price diff', () => {
    expect(getPriceDifference({ initialPrice: '106', defaultInitialPrice, priceInverted: false })).toStrictEqual({
      value: 6,
      absoluteValue: 6,
      warning: WarningSeverity.Medium,
    })
  })

  it('returns the correct warning for a high severity price diff', () => {
    expect(getPriceDifference({ initialPrice: '111', defaultInitialPrice, priceInverted: false })).toStrictEqual({
      value: 11,
      absoluteValue: 11,
      warning: WarningSeverity.High,
    })
  })
})
