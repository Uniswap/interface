import type { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { describe, expect, it, vi } from 'vitest'
import { formatFiatWithSubscript } from '~/pages/PoolDetails/components/formatFiatWithSubscript'

type LocalizationContextState = ReturnType<typeof useLocalizationContext>

const usdCurrencyInfo = { code: 'USD', symbol: '$' }

const mockConvertFiatAmount: LocalizationContextState['convertFiatAmount'] = vi.fn((usd) => ({
  amount: usd,
  // The minimal currency shape used by callers; not exercised in these tests.
  currency: 'USD' as never,
}))

const mockConvertFiatAmountFormatted: LocalizationContextState['convertFiatAmountFormatted'] = vi.fn(
  (usd) => `formatted:${usd}`,
)

const mockAddFiatSymbolToNumber: LocalizationContextState['addFiatSymbolToNumber'] = vi.fn(
  ({ value, currencySymbol }) => `${currencySymbol}${value}`,
)

describe('formatFiatWithSubscript', () => {
  it('uses convertFiatAmountFormatted for zero', () => {
    expect(
      formatFiatWithSubscript({
        usdValue: 0,
        locale: 'en-US',
        fiatCurrencyInfo: usdCurrencyInfo,
        convertFiatAmount: mockConvertFiatAmount,
        convertFiatAmountFormatted: mockConvertFiatAmountFormatted,
        addFiatSymbolToNumber: mockAddFiatSymbolToNumber,
      }),
    ).toBe('formatted:0')
  })

  it('uses convertFiatAmountFormatted for values at or above the threshold', () => {
    expect(
      formatFiatWithSubscript({
        usdValue: 0.05,
        locale: 'en-US',
        fiatCurrencyInfo: usdCurrencyInfo,
        convertFiatAmount: mockConvertFiatAmount,
        convertFiatAmountFormatted: mockConvertFiatAmountFormatted,
        addFiatSymbolToNumber: mockAddFiatSymbolToNumber,
      }),
    ).toBe('formatted:0.05')
  })

  it('uses subscript notation for sub-threshold USD values', () => {
    // 0.0000123 → 4 leading zeros, sig digits "123" → "$0.0₄123"
    expect(
      formatFiatWithSubscript({
        usdValue: 0.0000123,
        locale: 'en-US',
        fiatCurrencyInfo: usdCurrencyInfo,
        convertFiatAmount: mockConvertFiatAmount,
        convertFiatAmountFormatted: mockConvertFiatAmountFormatted,
        addFiatSymbolToNumber: mockAddFiatSymbolToNumber,
      }),
    ).toBe('$0.0₄123')
  })

  it('respects a custom subscriptThreshold', () => {
    // With threshold 1e-8, 0.0000123 is above threshold → falls through to fiat formatter.
    expect(
      formatFiatWithSubscript({
        usdValue: 0.0000123,
        locale: 'en-US',
        fiatCurrencyInfo: usdCurrencyInfo,
        convertFiatAmount: mockConvertFiatAmount,
        convertFiatAmountFormatted: mockConvertFiatAmountFormatted,
        addFiatSymbolToNumber: mockAddFiatSymbolToNumber,
        subscriptThreshold: 1e-8,
      }),
    ).toBe('formatted:0.0000123')
  })

  it('forwards maxSigDigits through to the subscript helper', () => {
    // maxSigDigits=6 keeps "123456"
    expect(
      formatFiatWithSubscript({
        usdValue: 0.0000001234567,
        locale: 'en-US',
        fiatCurrencyInfo: usdCurrencyInfo,
        convertFiatAmount: mockConvertFiatAmount,
        convertFiatAmountFormatted: mockConvertFiatAmountFormatted,
        addFiatSymbolToNumber: mockAddFiatSymbolToNumber,
        maxSigDigits: 6,
      }),
    ).toBe('$0.0₆123457')
  })

  it('falls back to the fiat formatter when the conversion returns no amount', () => {
    const mockNullConvert: LocalizationContextState['convertFiatAmount'] = vi.fn(() => ({
      amount: 0,
      currency: 'USD' as never,
    }))
    expect(
      formatFiatWithSubscript({
        usdValue: 0.0000001,
        locale: 'en-US',
        fiatCurrencyInfo: usdCurrencyInfo,
        convertFiatAmount: mockNullConvert,
        convertFiatAmountFormatted: mockConvertFiatAmountFormatted,
        addFiatSymbolToNumber: mockAddFiatSymbolToNumber,
      }),
    ).toBe('formatted:1e-7')
  })
})
