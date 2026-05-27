import type { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { describe, expect, it, vi } from 'vitest'
import { formatPriceWithSubscript } from '~/pages/PoolDetails/components/formatPriceWithSubscript'

type FormatNumberOrString = ReturnType<typeof useLocalizationContext>['formatNumberOrString']

const mockFormatNumberOrString: FormatNumberOrString = vi.fn(({ value, type }) => {
  if (typeof value !== 'number') {
    return String(value ?? '')
  }
  // Use a distinct prefix per NumberType so tests can verify the right formatter was invoked.
  return `${type}:${value.toFixed(3)}`
})

describe('formatPriceWithSubscript', () => {
  describe('defaults (chart use: TokenNonTx, threshold 0.001)', () => {
    it('falls through to TokenNonTx for zero', () => {
      expect(
        formatPriceWithSubscript({ price: 0, locale: 'en-US', formatNumberOrString: mockFormatNumberOrString }),
      ).toBe('token-non-tx:0.000')
    })

    it('falls through to TokenNonTx at or above 0.001', () => {
      expect(
        formatPriceWithSubscript({ price: 0.5, locale: 'en-US', formatNumberOrString: mockFormatNumberOrString }),
      ).toBe('token-non-tx:0.500')
      expect(
        formatPriceWithSubscript({ price: 0.001, locale: 'en-US', formatNumberOrString: mockFormatNumberOrString }),
      ).toBe('token-non-tx:0.001')
    })

    it('uses subscript notation below 0.001', () => {
      expect(
        formatPriceWithSubscript({ price: 0.000052, locale: 'en-US', formatNumberOrString: mockFormatNumberOrString }),
      ).toBe('0.0₄52')
    })

    it('uses subscript notation regardless of sign for tiny values', () => {
      expect(
        formatPriceWithSubscript({ price: -0.000052, locale: 'en-US', formatNumberOrString: mockFormatNumberOrString }),
      ).toBe('0.0₄52')
    })
  })

  describe('overrides (transactions table use: TokenTx, threshold 0.00001)', () => {
    it('falls through to TokenTx at or above the supplied threshold', () => {
      expect(
        formatPriceWithSubscript({
          price: 0.0001,
          locale: 'en-US',
          formatNumberOrString: mockFormatNumberOrString,
          numberType: NumberType.TokenTx,
          subscriptThreshold: 0.00001,
        }),
      ).toBe('token-tx:0.000')
    })

    it('uses subscript notation below the supplied threshold', () => {
      // 0.000000123 → 6 leading zeros, 3 sig digits → "0.0₆123"
      expect(
        formatPriceWithSubscript({
          price: 0.000000123,
          locale: 'en-US',
          formatNumberOrString: mockFormatNumberOrString,
          numberType: NumberType.TokenTx,
          subscriptThreshold: 0.00001,
        }),
      ).toBe('0.0₆123')
    })
  })

  describe('sig-digit overrides', () => {
    it('forwards maxSigDigits to the subscript helper', () => {
      // 0.0000001234567 → 6 leading zeros. maxSigDigits=6 keeps "123456".
      expect(
        formatPriceWithSubscript({
          price: 0.0000001234567,
          locale: 'en-US',
          formatNumberOrString: mockFormatNumberOrString,
          maxSigDigits: 6,
        }),
      ).toBe('0.0₆123457')
    })
  })
})
