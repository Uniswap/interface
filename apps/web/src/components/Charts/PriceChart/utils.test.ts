import { FiatCurrency } from 'uniswap/src/features/fiatCurrency/constants'
import type { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { describe, expect, it, vi } from 'vitest'
import { formatPriceAxisLabel } from '~/components/Charts/PriceChart/utils'

function createFormat() {
  return {
    convertFiatAmount: vi.fn((amount: number) => ({ amount, currency: FiatCurrency.UnitedStatesDollar })),
    convertFiatAmountFormatted: vi.fn((amount: number, type: NumberType) => `${type}:${amount}`),
  }
}

describe('formatPriceAxisLabel', () => {
  it('formats a valid fixed precision as currency', () => {
    const format = createFormat()

    expect(
      formatPriceAxisLabel({
        scaledPrice: 1.234,
        scaleFactor: 1,
        decimals: 2,
        format: format as unknown as ReturnType<typeof useLocalizationContext>,
        locale: 'en-US',
      }),
    ).toBe('$1.23')
    expect(format.convertFiatAmountFormatted).not.toHaveBeenCalled()
  })

  it('falls back when precision exceeds Intl.NumberFormat limits', () => {
    const format = createFormat()

    expect(
      formatPriceAxisLabel({
        scaledPrice: 1.234,
        scaleFactor: 1,
        decimals: 101,
        format: format as unknown as ReturnType<typeof useLocalizationContext>,
        locale: 'en-US',
      }),
    ).toBe(`fiat-token-price:1.234`)
    expect(format.convertFiatAmount).not.toHaveBeenCalled()
    expect(format.convertFiatAmountFormatted).toHaveBeenCalledWith(1.234, NumberType.FiatTokenPrice)
  })
})
