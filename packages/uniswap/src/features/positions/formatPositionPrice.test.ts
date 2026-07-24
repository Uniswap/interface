import type { LocalizationContextState } from 'uniswap/src/features/language/LocalizationContext'
import { formatPositionPrice } from 'uniswap/src/features/positions/formatPositionPrice'
import { formatNumberOrString } from 'utilities/src/format/localeBased'
import { NumberType } from 'utilities/src/format/types'
import { describe, expect, it } from 'vitest'

const locale = 'en-US'

const mockFormatNumberOrString: LocalizationContextState['formatNumberOrString'] = (input) =>
  formatNumberOrString({
    price: input.value,
    locale,
    type: input.type ?? NumberType.TokenNonTx,
    placeholder: input.placeholder,
  })

function format(value: Maybe<number | string>): string {
  return formatPositionPrice({ value, locale, formatNumberOrString: mockFormatNumberOrString })
}

describe('formatPositionPrice', () => {
  it('renders subscript notation instead of the "<0.00001" TokenTx floor', () => {
    expect(format(0.0000000030811)).toBe('0.0₈3081')
    expect(format(0.0000012)).toBe('0.0₅12')
  })

  it('accepts string values (Price.toSignificant output)', () => {
    expect(format('0.0000000030811')).toBe('0.0₈3081')
  })

  it('renders subscript for sub-threshold values with only 3 leading zeros (CASHCAT/WETH range)', () => {
    // Reported values: Min/Max/Market prices that previously showed a mix of subscript and plain
    // decimals. All sub-0.001 values now render consistently in subscript notation.
    expect(format(0.00003)).toBe('0.0₄30')
    expect(format(0.00021)).toBe('0.0₃21')
    expect(format(0.00006)).toBe('0.0₄60')
    expect(format(0.0005)).toBe('0.0₃50')
  })

  it('falls through to TokenTx formatting at and above the threshold', () => {
    expect(format(0.001)).toBe('0.001')
    expect(format(0.5)).toBe('0.50')
    expect(format(1234.5678)).toBe('1,234.57')
  })

  it('handles zero and missing values via TokenTx formatting', () => {
    expect(format(0)).toBe('0')
    expect(format(undefined)).toBe('-')
    expect(format(null)).toBe('-')
  })
})
