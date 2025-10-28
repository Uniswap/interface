/* eslint-disable max-lines */
import { FiatCurrency } from 'uniswap/src/features/fiatCurrency/constants'
import { formatChartFiatDelta } from 'uniswap/src/features/fiatCurrency/priceChart/priceChartConversion'
import { FormatNumberOrStringInput } from 'uniswap/src/features/language/formatter'

// Minimal test formatter that matches expected test output
const defaultFormatter = (input: FormatNumberOrStringInput): string => {
  const { value, currencyCode, type } = input
  if (value === null || value === undefined) {
    return '-'
  }

  const num = typeof value === 'number' ? value : parseFloat(value)
  const currencySymbols: Record<string, string> = {
    USD: '$',
    GBP: '£',
    EUR: 'EUR ',
    JPY: '¥',
    INR: '₹',
  }

  const symbol = currencySymbols[currencyCode || 'USD'] || currencyCode + ' '

  if (type === 'fiat-standard') {
    let decimals = 2
    const str = num.toString()
    const match = str.match(/\.(\d+)/)
    if (match && match[1]) {
      decimals = Math.max(2, match[1].length)
    }

    const formatted = num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
    if (num >= 1 && num === Math.floor(num)) {
      return `${symbol}${formatted.replace(/\.00$/, '')}`
    }
    return `${symbol}${formatted}`
  }

  const getDecimals = (n: number): number => {
    const abs = Math.abs(n)
    if (abs === 0 || abs >= 0.1) {
      return 2
    }
    if (abs >= 0.01) {
      return Math.max(2, n.toString().replace(/.*\./, '').replace(/0+$/, '').length)
    }
    if (abs >= 0.001) {
      return Math.max(3, n.toString().replace(/.*\./, '').replace(/0+$/, '').length)
    }
    if (abs >= 0.0001) {
      return Math.max(4, n.toString().replace(/.*\./, '').replace(/0+$/, '').length)
    }
    if (abs >= 0.00001) {
      return Math.max(5, n.toString().replace(/.*\./, '').replace(/0+$/, '').length)
    }
    return 6
  }

  const decimals = getDecimals(num)
  let formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

  // Trim trailing zeros for whole numbers (e.g., $1.00 -> $1)
  if (decimals === 2 && num >= 1 && num === Math.floor(num)) {
    formatted = formatted.replace(/\.00$/, '')
  }

  return `${symbol}${formatted}`
}

describe('formatChartFiatDelta', () => {
  describe('normal crypto formatting', () => {
    describe('values >= $1', () => {
      it('formats positive values with 2 decimals', () => {
        expect(
          formatChartFiatDelta({ startingPrice: 100, endingPrice: 101.25, formatNumberOrString: defaultFormatter })
            .formatted,
        ).toBe('$1.25')
        expect(
          formatChartFiatDelta({ startingPrice: 100, endingPrice: 2530.1, formatNumberOrString: defaultFormatter })
            .formatted,
        ).toBe('$2,430.10')
        expect(
          formatChartFiatDelta({ startingPrice: 100, endingPrice: 101, formatNumberOrString: defaultFormatter })
            .formatted,
        ).toBe('$1')
        expect(
          formatChartFiatDelta({ startingPrice: 100, endingPrice: 1099.99, formatNumberOrString: defaultFormatter })
            .formatted,
        ).toBe('$999.99')
      })

      it('formats negative values with 2 decimals', () => {
        expect(
          formatChartFiatDelta({ startingPrice: 100, endingPrice: 100 + -1.25, formatNumberOrString: defaultFormatter })
            .formatted,
        ).toBe('$1.25')
        expect(
          formatChartFiatDelta({
            startingPrice: 100,
            endingPrice: 100 + -2430.1,
            formatNumberOrString: defaultFormatter,
          }).formatted,
        ).toBe('$2,430.10')
        expect(
          formatChartFiatDelta({ startingPrice: 100, endingPrice: 100 + -1.0, formatNumberOrString: defaultFormatter })
            .formatted,
        ).toBe('$1')
        expect(
          formatChartFiatDelta({
            startingPrice: 100,
            endingPrice: 100 + -999.99,
            formatNumberOrString: defaultFormatter,
          }).formatted,
        ).toBe('$999.99')
      })

      it('uses thousand separators', () => {
        expect(
          formatChartFiatDelta({
            startingPrice: 100,
            endingPrice: 100 + 1234.56,
            formatNumberOrString: defaultFormatter,
          }).formatted,
        ).toBe('$1,234.56')
        expect(
          formatChartFiatDelta({
            startingPrice: 100,
            endingPrice: 100 + 1234567.89,
            formatNumberOrString: defaultFormatter,
          }).formatted,
        ).toBe('$1,234,567.89')
        expect(
          formatChartFiatDelta({
            startingPrice: 100,
            endingPrice: 100 + -1234567.89,
            formatNumberOrString: defaultFormatter,
          }).formatted,
        ).toBe('$1,234,567.89')
      })

      it('trims trailing zeros', () => {
        expect(
          formatChartFiatDelta({ startingPrice: 100, endingPrice: 100 + 1.0, formatNumberOrString: defaultFormatter })
            .formatted,
        ).toBe('$1')
        expect(
          formatChartFiatDelta({ startingPrice: 100, endingPrice: 100 + 1.1, formatNumberOrString: defaultFormatter })
            .formatted,
        ).toBe('$1.10')
        expect(
          formatChartFiatDelta({ startingPrice: 100, endingPrice: 100 + 1.2, formatNumberOrString: defaultFormatter })
            .formatted,
        ).toBe('$1.20')
      })
    })

    describe('values >= $0.10 and < $1', () => {
      it('formats positive values with 2 decimals', () => {
        expect(
          formatChartFiatDelta({ startingPrice: 100, endingPrice: 100 + 0.57, formatNumberOrString: defaultFormatter })
            .formatted,
        ).toBe('$0.57')
        expect(
          formatChartFiatDelta({ startingPrice: 100, endingPrice: 100 + 0.14, formatNumberOrString: defaultFormatter })
            .formatted,
        ).toBe('$0.14')
        expect(
          formatChartFiatDelta({ startingPrice: 100, endingPrice: 100 + 0.1, formatNumberOrString: defaultFormatter })
            .formatted,
        ).toBe('$0.10')
        expect(
          formatChartFiatDelta({ startingPrice: 100, endingPrice: 100 + 0.99, formatNumberOrString: defaultFormatter })
            .formatted,
        ).toBe('$0.99')
      })

      it('formats negative values with 2 decimals', () => {
        expect(
          formatChartFiatDelta({ startingPrice: 100, endingPrice: 100 + -0.57, formatNumberOrString: defaultFormatter })
            .formatted,
        ).toBe('$0.57')
        expect(
          formatChartFiatDelta({ startingPrice: 100, endingPrice: 100 + -0.14, formatNumberOrString: defaultFormatter })
            .formatted,
        ).toBe('$0.14')
        expect(
          formatChartFiatDelta({ startingPrice: 100, endingPrice: 100 + -0.1, formatNumberOrString: defaultFormatter })
            .formatted,
        ).toBe('$0.10')
        expect(
          formatChartFiatDelta({ startingPrice: 100, endingPrice: 100 + -0.99, formatNumberOrString: defaultFormatter })
            .formatted,
        ).toBe('$0.99')
      })

      it('trims trailing zeros', () => {
        expect(
          formatChartFiatDelta({ startingPrice: 100, endingPrice: 100 + 0.1, formatNumberOrString: defaultFormatter })
            .formatted,
        ).toBe('$0.10')
        expect(
          formatChartFiatDelta({ startingPrice: 100, endingPrice: 100 + 0.5, formatNumberOrString: defaultFormatter })
            .formatted,
        ).toBe('$0.50')
      })
    })

    describe('values >= $0.01 and < $0.10', () => {
      it('formats positive values with 3 decimals', () => {
        expect(
          formatChartFiatDelta({ startingPrice: 100, endingPrice: 100 + 0.053, formatNumberOrString: defaultFormatter })
            .formatted,
        ).toBe('$0.053')
        expect(
          formatChartFiatDelta({ startingPrice: 100, endingPrice: 100 + 0.096, formatNumberOrString: defaultFormatter })
            .formatted,
        ).toBe('$0.096')
        expect(
          formatChartFiatDelta({ startingPrice: 100, endingPrice: 100 + 0.01, formatNumberOrString: defaultFormatter })
            .formatted,
        ).toBe('$0.01')
        expect(
          formatChartFiatDelta({ startingPrice: 100, endingPrice: 100 + 0.099, formatNumberOrString: defaultFormatter })
            .formatted,
        ).toBe('$0.099')
      })

      it('formats negative values with 3 decimals', () => {
        expect(
          formatChartFiatDelta({
            startingPrice: 100,
            endingPrice: 100 + -0.053,
            formatNumberOrString: defaultFormatter,
          }).formatted,
        ).toBe('$0.053')
        expect(
          formatChartFiatDelta({
            startingPrice: 100,
            endingPrice: 100 + -0.096,
            formatNumberOrString: defaultFormatter,
          }).formatted,
        ).toBe('$0.096')
        expect(
          formatChartFiatDelta({ startingPrice: 100, endingPrice: 100 + -0.01, formatNumberOrString: defaultFormatter })
            .formatted,
        ).toBe('$0.01')
        expect(
          formatChartFiatDelta({
            startingPrice: 100,
            endingPrice: 100 + -0.099,
            formatNumberOrString: defaultFormatter,
          }).formatted,
        ).toBe('$0.099')
      })

      it('trims trailing zeros but keeps at least 2 decimals', () => {
        expect(
          formatChartFiatDelta({ startingPrice: 100, endingPrice: 100 + 0.01, formatNumberOrString: defaultFormatter })
            .formatted,
        ).toBe('$0.01')
        expect(
          formatChartFiatDelta({ startingPrice: 100, endingPrice: 100 + 0.05, formatNumberOrString: defaultFormatter })
            .formatted,
        ).toBe('$0.05')
      })
    })

    describe('values >= $0.001 and < $0.01', () => {
      it('formats positive values with 4 decimals', () => {
        expect(
          formatChartFiatDelta({
            startingPrice: 100,
            endingPrice: 100 + 0.0075,
            formatNumberOrString: defaultFormatter,
          }).formatted,
        ).toBe('$0.0075')
        expect(
          formatChartFiatDelta({
            startingPrice: 100,
            endingPrice: 100 + 0.0031,
            formatNumberOrString: defaultFormatter,
          }).formatted,
        ).toBe('$0.0031')
        expect(
          formatChartFiatDelta({ startingPrice: 100, endingPrice: 100 + 0.001, formatNumberOrString: defaultFormatter })
            .formatted,
        ).toBe('$0.001')
        expect(
          formatChartFiatDelta({
            startingPrice: 100,
            endingPrice: 100 + 0.0099,
            formatNumberOrString: defaultFormatter,
          }).formatted,
        ).toBe('$0.0099')
      })

      it('formats negative values with 4 decimals', () => {
        expect(
          formatChartFiatDelta({
            startingPrice: 100,
            endingPrice: 100 + -0.0075,
            formatNumberOrString: defaultFormatter,
          }).formatted,
        ).toBe('$0.0075')
        expect(
          formatChartFiatDelta({
            startingPrice: 100,
            endingPrice: 100 + -0.0031,
            formatNumberOrString: defaultFormatter,
          }).formatted,
        ).toBe('$0.0031')
        expect(
          formatChartFiatDelta({
            startingPrice: 100,
            endingPrice: 100 + -0.001,
            formatNumberOrString: defaultFormatter,
          }).formatted,
        ).toBe('$0.001')
        expect(
          formatChartFiatDelta({
            startingPrice: 100,
            endingPrice: 100 + -0.0099,
            formatNumberOrString: defaultFormatter,
          }).formatted,
        ).toBe('$0.0099')
      })

      it('trims trailing zeros but keeps minimum decimals', () => {
        expect(
          formatChartFiatDelta({ startingPrice: 100, endingPrice: 100 + 0.001, formatNumberOrString: defaultFormatter })
            .formatted,
        ).toBe('$0.001')
        expect(
          formatChartFiatDelta({
            startingPrice: 100,
            endingPrice: 100 + 0.0012,
            formatNumberOrString: defaultFormatter,
          }).formatted,
        ).toBe('$0.0012')
      })
    })

    describe('values >= $0.0001 and < $0.001', () => {
      it('formats positive values with 5 decimals', () => {
        expect(
          formatChartFiatDelta({
            startingPrice: 100,
            endingPrice: 100 + 0.00083,
            formatNumberOrString: defaultFormatter,
          }).formatted,
        ).toBe('$0.00083')
        expect(
          formatChartFiatDelta({
            startingPrice: 100,
            endingPrice: 100 + 0.00022,
            formatNumberOrString: defaultFormatter,
          }).formatted,
        ).toBe('$0.00022')
        expect(
          formatChartFiatDelta({
            startingPrice: 100,
            endingPrice: 100 + 0.0001,
            formatNumberOrString: defaultFormatter,
          }).formatted,
        ).toBe('$0.0001')
        expect(
          formatChartFiatDelta({
            startingPrice: 100,
            endingPrice: 100 + 0.00099,
            formatNumberOrString: defaultFormatter,
          }).formatted,
        ).toBe('$0.00099')
      })

      it('formats negative values with 5 decimals', () => {
        expect(
          formatChartFiatDelta({
            startingPrice: 100,
            endingPrice: 100 + -0.00083,
            formatNumberOrString: defaultFormatter,
          }).formatted,
        ).toBe('$0.00083')
        expect(
          formatChartFiatDelta({
            startingPrice: 100,
            endingPrice: 100 + -0.00022,
            formatNumberOrString: defaultFormatter,
          }).formatted,
        ).toBe('$0.00022')
        expect(
          formatChartFiatDelta({
            startingPrice: 100,
            endingPrice: 100 + -0.0001,
            formatNumberOrString: defaultFormatter,
          }).formatted,
        ).toBe('$0.0001')
        expect(
          formatChartFiatDelta({
            startingPrice: 100,
            endingPrice: 100 + -0.00099,
            formatNumberOrString: defaultFormatter,
          }).formatted,
        ).toBe('$0.00099')
      })

      it('trims trailing zeros but keeps minimum decimals', () => {
        expect(
          formatChartFiatDelta({
            startingPrice: 100,
            endingPrice: 100 + 0.0001,
            formatNumberOrString: defaultFormatter,
          }).formatted,
        ).toBe('$0.0001')
        expect(
          formatChartFiatDelta({
            startingPrice: 100,
            endingPrice: 100 + 0.00012,
            formatNumberOrString: defaultFormatter,
          }).formatted,
        ).toBe('$0.00012')
      })
    })

    describe('values >= $0.00001 and < $0.0001', () => {
      it('formats positive values with 6 decimals', () => {
        expect(
          formatChartFiatDelta({
            startingPrice: 100,
            endingPrice: 100 + 0.000019,
            formatNumberOrString: defaultFormatter,
          }).formatted,
        ).toBe('$0.000019')
        expect(
          formatChartFiatDelta({
            startingPrice: 100,
            endingPrice: 100 + 0.000094,
            formatNumberOrString: defaultFormatter,
          }).formatted,
        ).toBe('$0.000094')
        expect(
          formatChartFiatDelta({
            startingPrice: 100,
            endingPrice: 100 + 0.00001,
            formatNumberOrString: defaultFormatter,
          }).formatted,
        ).toBe('$0.00001')
        expect(
          formatChartFiatDelta({
            startingPrice: 100,
            endingPrice: 100 + 0.000099,
            formatNumberOrString: defaultFormatter,
          }).formatted,
        ).toBe('$0.000099')
      })

      it('formats negative values with 6 decimals', () => {
        expect(
          formatChartFiatDelta({
            startingPrice: 100,
            endingPrice: 100 + -0.000019,
            formatNumberOrString: defaultFormatter,
          }).formatted,
        ).toBe('$0.000019')
        expect(
          formatChartFiatDelta({
            startingPrice: 100,
            endingPrice: 100 + -0.000094,
            formatNumberOrString: defaultFormatter,
          }).formatted,
        ).toBe('$0.000094')
        expect(
          formatChartFiatDelta({
            startingPrice: 100,
            endingPrice: 100 + -0.00001,
            formatNumberOrString: defaultFormatter,
          }).formatted,
        ).toBe('$0.00001')
        expect(
          formatChartFiatDelta({
            startingPrice: 100,
            endingPrice: 100 + -0.000099,
            formatNumberOrString: defaultFormatter,
          }).formatted,
        ).toBe('$0.000099')
      })

      it('trims trailing zeros but keeps minimum decimals', () => {
        expect(
          formatChartFiatDelta({
            startingPrice: 100,
            endingPrice: 100 + 0.00001,
            formatNumberOrString: defaultFormatter,
          }).formatted,
        ).toBe('$0.00001')
        expect(
          formatChartFiatDelta({
            startingPrice: 100,
            endingPrice: 100 + 0.000012,
            formatNumberOrString: defaultFormatter,
          }).formatted,
        ).toBe('$0.000012')
      })
    })

    describe('values < $0.000001', () => {
      it('formats as threshold with exact value in tooltip', () => {
        expect(
          formatChartFiatDelta({
            startingPrice: 100,
            endingPrice: 100 + 0.0000001,
            formatNumberOrString: defaultFormatter,
          }).formatted,
        ).toBe('<$0.000001')
        expect(
          formatChartFiatDelta({
            startingPrice: 100,
            endingPrice: 100 + 0.0000009,
            formatNumberOrString: defaultFormatter,
          }).formatted,
        ).toBe('<$0.000001')
        expect(
          formatChartFiatDelta({
            startingPrice: 100,
            endingPrice: 100 + -0.0000001,
            formatNumberOrString: defaultFormatter,
          }).formatted,
        ).toBe('<$0.000001')
        expect(
          formatChartFiatDelta({
            startingPrice: 100,
            endingPrice: 100 + -0.0000009,
            formatNumberOrString: defaultFormatter,
          }).formatted,
        ).toBe('<$0.000001')
      })
    })

    describe('zero value', () => {
      it('formats as $0.00', () => {
        expect(
          formatChartFiatDelta({ startingPrice: 100, endingPrice: 100 + 0, formatNumberOrString: defaultFormatter })
            .formatted,
        ).toBe('$0.00')
      })
    })
  })

  describe('stablecoin formatting', () => {
    describe('values >= $1', () => {
      it('formats positive values with 2 decimals', () => {
        expect(
          formatChartFiatDelta({
            startingPrice: 100,
            endingPrice: 100 + 1.25,
            isStablecoin: true,
            formatNumberOrString: defaultFormatter,
          }).formatted,
        ).toBe('$1.25')
        expect(
          formatChartFiatDelta({
            startingPrice: 100,
            endingPrice: 100 + 2430.1,
            isStablecoin: true,
            formatNumberOrString: defaultFormatter,
          }).formatted,
        ).toBe('$2,430.10')
      })

      it('formats negative values with 2 decimals', () => {
        expect(
          formatChartFiatDelta({
            startingPrice: 100,
            endingPrice: 100 + -1.25,
            isStablecoin: true,
            formatNumberOrString: defaultFormatter,
          }).formatted,
        ).toBe('$1.25')
        expect(
          formatChartFiatDelta({
            startingPrice: 100,
            endingPrice: 100 + -2430.1,
            isStablecoin: true,
            formatNumberOrString: defaultFormatter,
          }).formatted,
        ).toBe('$2,430.10')
      })
    })

    describe('values >= $0.10 and < $1', () => {
      it('formats positive values with 2 decimals', () => {
        expect(
          formatChartFiatDelta({
            startingPrice: 100,
            endingPrice: 100 + 0.42,
            isStablecoin: true,
            formatNumberOrString: defaultFormatter,
          }).formatted,
        ).toBe('$0.42')
        expect(
          formatChartFiatDelta({
            startingPrice: 100,
            endingPrice: 100 + 0.1,
            isStablecoin: true,
            formatNumberOrString: defaultFormatter,
          }).formatted,
        ).toBe('$0.10')
        expect(
          formatChartFiatDelta({
            startingPrice: 100,
            endingPrice: 100 + 0.99,
            isStablecoin: true,
            formatNumberOrString: defaultFormatter,
          }).formatted,
        ).toBe('$0.99')
      })

      it('formats negative values with 2 decimals', () => {
        expect(
          formatChartFiatDelta({
            startingPrice: 100,
            endingPrice: 100 + -0.42,
            isStablecoin: true,
            formatNumberOrString: defaultFormatter,
          }).formatted,
        ).toBe('$0.42')
        expect(
          formatChartFiatDelta({
            startingPrice: 100,
            endingPrice: 100 + -0.1,
            isStablecoin: true,
            formatNumberOrString: defaultFormatter,
          }).formatted,
        ).toBe('$0.10')
        expect(
          formatChartFiatDelta({
            startingPrice: 100,
            endingPrice: 100 + -0.99,
            isStablecoin: true,
            formatNumberOrString: defaultFormatter,
          }).formatted,
        ).toBe('$0.99')
      })
    })

    describe('values >= $0.01 and < $0.10', () => {
      it('formats positive values with 2 decimals', () => {
        expect(
          formatChartFiatDelta({
            startingPrice: 100,
            endingPrice: 100 + 0.07,
            isStablecoin: true,
            formatNumberOrString: defaultFormatter,
          }).formatted,
        ).toBe('$0.07')
        expect(
          formatChartFiatDelta({
            startingPrice: 100,
            endingPrice: 100 + 0.01,
            isStablecoin: true,
            formatNumberOrString: defaultFormatter,
          }).formatted,
        ).toBe('$0.01')
        expect(
          formatChartFiatDelta({
            startingPrice: 100,
            endingPrice: 100 + 0.099,
            isStablecoin: true,
            formatNumberOrString: defaultFormatter,
          }).formatted,
        ).toBe('$0.10')
      })

      it('formats negative values with 2 decimals', () => {
        expect(
          formatChartFiatDelta({
            startingPrice: 100,
            endingPrice: 100 + -0.07,
            isStablecoin: true,
            formatNumberOrString: defaultFormatter,
          }).formatted,
        ).toBe('$0.07')
        expect(
          formatChartFiatDelta({
            startingPrice: 100,
            endingPrice: 100 + -0.01,
            isStablecoin: true,
            formatNumberOrString: defaultFormatter,
          }).formatted,
        ).toBe('$0.01')
        expect(
          formatChartFiatDelta({
            startingPrice: 100,
            endingPrice: 100 + -0.099,
            isStablecoin: true,
            formatNumberOrString: defaultFormatter,
          }).formatted,
        ).toBe('$0.10')
      })
    })

    describe('values >= $0.001 and < $0.01', () => {
      it('formats positive values with 3 decimals', () => {
        expect(
          formatChartFiatDelta({
            startingPrice: 100,
            endingPrice: 100 + 0.003,
            isStablecoin: true,
            formatNumberOrString: defaultFormatter,
          }).formatted,
        ).toBe('$0.003')
        expect(
          formatChartFiatDelta({
            startingPrice: 100,
            endingPrice: 100 + 0.001,
            isStablecoin: true,
            formatNumberOrString: defaultFormatter,
          }).formatted,
        ).toBe('$0.001')
        expect(
          formatChartFiatDelta({
            startingPrice: 100,
            endingPrice: 100 + 0.0099,
            isStablecoin: true,
            formatNumberOrString: defaultFormatter,
          }).formatted,
        ).toBe('$0.01')
      })

      it('formats negative values with 3 decimals', () => {
        expect(
          formatChartFiatDelta({
            startingPrice: 100,
            endingPrice: 100 + -0.003,
            isStablecoin: true,
            formatNumberOrString: defaultFormatter,
          }).formatted,
        ).toBe('$0.003')
        expect(
          formatChartFiatDelta({
            startingPrice: 100,
            endingPrice: 100 + -0.001,
            isStablecoin: true,
            formatNumberOrString: defaultFormatter,
          }).formatted,
        ).toBe('$0.001')
        expect(
          formatChartFiatDelta({
            startingPrice: 100,
            endingPrice: 100 + -0.0099,
            isStablecoin: true,
            formatNumberOrString: defaultFormatter,
          }).formatted,
        ).toBe('$0.01')
      })
    })

    describe('values < $0.001', () => {
      it('formats as $0.00', () => {
        expect(
          formatChartFiatDelta({
            startingPrice: 100,
            endingPrice: 100 + 0.0001,
            isStablecoin: true,
            formatNumberOrString: defaultFormatter,
          }).formatted,
        ).toBe('$0.00')
        expect(
          formatChartFiatDelta({
            startingPrice: 100,
            endingPrice: 100 + 0.0009,
            isStablecoin: true,
            formatNumberOrString: defaultFormatter,
          }).formatted,
        ).toBe('$0.00')
        expect(
          formatChartFiatDelta({
            startingPrice: 100,
            endingPrice: 100 + -0.0001,
            isStablecoin: true,
            formatNumberOrString: defaultFormatter,
          }).formatted,
        ).toBe('$0.00')
        expect(
          formatChartFiatDelta({
            startingPrice: 100,
            endingPrice: 100 + -0.0009,
            isStablecoin: true,
            formatNumberOrString: defaultFormatter,
          }).formatted,
        ).toBe('$0.00')
      })
    })

    describe('zero value', () => {
      it('formats as $0.00', () => {
        expect(
          formatChartFiatDelta({
            startingPrice: 100,
            endingPrice: 100 + 0,
            isStablecoin: true,
            formatNumberOrString: defaultFormatter,
          }).formatted,
        ).toBe('$0.00')
      })
    })
  })

  describe('formatFiatDelta with isStablecoin flag', () => {
    it('uses stablecoin formatting when isStablecoin is true', () => {
      expect(
        formatChartFiatDelta({
          startingPrice: 100,
          endingPrice: 100 + 0.003,
          isStablecoin: true,
          formatNumberOrString: defaultFormatter,
        }).formatted,
      ).toBe('$0.003')
      expect(
        formatChartFiatDelta({
          startingPrice: 100,
          endingPrice: 100 + 0.0001,
          isStablecoin: true,
          formatNumberOrString: defaultFormatter,
        }).formatted,
      ).toBe('$0.00')
      expect(
        formatChartFiatDelta({
          startingPrice: 100,
          endingPrice: 100 + 1.25,
          isStablecoin: true,
          formatNumberOrString: defaultFormatter,
        }).formatted,
      ).toBe('$1.25')
    })

    it('uses normal formatting when isStablecoin is false', () => {
      expect(
        formatChartFiatDelta({
          startingPrice: 100,
          endingPrice: 100 + 0.003,
          isStablecoin: false,
          formatNumberOrString: defaultFormatter,
        }).formatted,
      ).toBe('$0.003')
      expect(
        formatChartFiatDelta({
          startingPrice: 100,
          endingPrice: 100 + 0.0001,
          isStablecoin: false,
          formatNumberOrString: defaultFormatter,
        }).formatted,
      ).toBe('$0.0001')
      expect(
        formatChartFiatDelta({
          startingPrice: 100,
          endingPrice: 100 + 1.25,
          isStablecoin: false,
          formatNumberOrString: defaultFormatter,
        }).formatted,
      ).toBe('$1.25')
    })
  })

  describe('currency support', () => {
    it('formats EUR currency with proper symbol', () => {
      expect(
        formatChartFiatDelta({
          startingPrice: 100,
          endingPrice: 100 + 100,
          currency: FiatCurrency.Euro,
          formatNumberOrString: defaultFormatter,
        }).formatted,
      ).toBe('EUR 100')
      expect(
        formatChartFiatDelta({
          startingPrice: 100,
          endingPrice: 100 + -50.5,
          currency: FiatCurrency.Euro,
          formatNumberOrString: defaultFormatter,
        }).formatted,
      ).toBe('EUR 50.50')
    })

    it('formats GBP currency with proper symbol', () => {
      expect(
        formatChartFiatDelta({
          startingPrice: 100,
          endingPrice: 100 + 100,
          currency: FiatCurrency.BritishPound,
          formatNumberOrString: defaultFormatter,
        }).formatted,
      ).toBe('£100')
      expect(
        formatChartFiatDelta({
          startingPrice: 100,
          endingPrice: 100 + -50.5,
          currency: FiatCurrency.BritishPound,
          formatNumberOrString: defaultFormatter,
        }).formatted,
      ).toBe('£50.50')
    })

    it('formats JPY currency with proper symbol', () => {
      expect(
        formatChartFiatDelta({
          startingPrice: 100,
          endingPrice: 100 + 100,
          currency: FiatCurrency.JapaneseYen,
          formatNumberOrString: defaultFormatter,
        }).formatted,
      ).toBe('¥100')
      expect(
        formatChartFiatDelta({
          startingPrice: 100,
          endingPrice: 100 + -50.5,
          currency: FiatCurrency.JapaneseYen,
          formatNumberOrString: defaultFormatter,
        }).formatted,
      ).toBe('¥50.50')
    })
  })

  describe('edge cases', () => {
    it('handles trimming edge cases that previously failed', () => {
      // Test case 1: Value that trims to whole number (previously would fail regex)
      // 1.000 with 4 decimals should trim to "1", not break
      expect(
        formatChartFiatDelta({
          startingPrice: 100,
          endingPrice: 101.0,
          formatNumberOrString: defaultFormatter,
        }).formatted,
      ).toBe('$1')

      // Test case 2: Value with all trailing zeros after rounding
      // 0.0010 with 4 decimals should trim to "0.001"
      expect(
        formatChartFiatDelta({
          startingPrice: 100,
          endingPrice: 100.001,
          formatNumberOrString: defaultFormatter,
        }).formatted,
      ).toBe('$0.001')

      // Test case 3: Value in the 3-decimal range that has trailing zeros
      // 0.0500 should trim to "0.05" (in the 3-decimal range >= 0.01 and < 0.10)
      expect(
        formatChartFiatDelta({
          startingPrice: 100,
          endingPrice: 100.05,
          formatNumberOrString: defaultFormatter,
        }).formatted,
      ).toBe('$0.05')

      // Test case 4: Very small value that needs all its decimals preserved
      // 0.00012 should keep all significant digits
      expect(
        formatChartFiatDelta({
          startingPrice: 1.0,
          endingPrice: 1.00012,
          formatNumberOrString: defaultFormatter,
        }).formatted,
      ).toBe('$0.00012')

      // Test case 5: Value that would have broken the old regex when decimal point is removed
      // 0.001000 with 4 decimals trims to "0.001", old logic would try to match non-existent decimal
      expect(
        formatChartFiatDelta({
          startingPrice: 100,
          endingPrice: 100.001,
          formatNumberOrString: defaultFormatter,
        }).formatted,
      ).toBe('$0.001')
    })

    it('handles rounding correctly', () => {
      expect(
        formatChartFiatDelta({ startingPrice: 100, endingPrice: 100 + 0.0999, formatNumberOrString: defaultFormatter })
          .formatted,
      ).toBe('$0.1')
      expect(
        formatChartFiatDelta({ startingPrice: 100, endingPrice: 100 + 0.00999, formatNumberOrString: defaultFormatter })
          .formatted,
      ).toBe('$0.01')
      expect(
        formatChartFiatDelta({ startingPrice: 100, endingPrice: 100 + 0.0994, formatNumberOrString: defaultFormatter })
          .formatted,
      ).toBe('$0.099')
    })

    it('handles very small negative values correctly', () => {
      expect(
        formatChartFiatDelta({
          startingPrice: 100,
          endingPrice: 100 + -0.0000001,
          formatNumberOrString: defaultFormatter,
        }).formatted,
      ).toBe('<$0.000001')
      expect(
        formatChartFiatDelta({
          startingPrice: 100,
          endingPrice: 100 + -0.000001,
          formatNumberOrString: defaultFormatter,
        }).formatted,
      ).toBe('<$0.000001')
    })

    it('handles values exactly at thresholds', () => {
      expect(
        formatChartFiatDelta({ startingPrice: 100, endingPrice: 100 + 1.0, formatNumberOrString: defaultFormatter })
          .formatted,
      ).toBe('$1')
      expect(
        formatChartFiatDelta({ startingPrice: 100, endingPrice: 100 + 0.1, formatNumberOrString: defaultFormatter })
          .formatted,
      ).toBe('$0.10')
      expect(
        formatChartFiatDelta({ startingPrice: 100, endingPrice: 100 + 0.01, formatNumberOrString: defaultFormatter })
          .formatted,
      ).toBe('$0.01')
      expect(
        formatChartFiatDelta({ startingPrice: 100, endingPrice: 100 + 0.001, formatNumberOrString: defaultFormatter })
          .formatted,
      ).toBe('$0.001')
      expect(
        formatChartFiatDelta({ startingPrice: 100, endingPrice: 100 + 0.0001, formatNumberOrString: defaultFormatter })
          .formatted,
      ).toBe('$0.0001')
      expect(
        formatChartFiatDelta({ startingPrice: 100, endingPrice: 100 + 0.00001, formatNumberOrString: defaultFormatter })
          .formatted,
      ).toBe('$0.00001')
      expect(
        formatChartFiatDelta({
          startingPrice: 100,
          endingPrice: 100 + 0.000001,
          formatNumberOrString: defaultFormatter,
        }).formatted,
      ).toBe('<$0.000001')
    })
  })
  describe('delta calculation', () => {
    it('calculates and formats positive delta for normal crypto', () => {
      const result = formatChartFiatDelta({
        startingPrice: 100,
        endingPrice: 103.53,
        isStablecoin: false,
        formatNumberOrString: defaultFormatter,
      })
      expect(result.formatted).toBe('$3.53')
      expect(result.rawDelta).toBeCloseTo(3.53, 5)
      expect(result.belowThreshold).toBeUndefined()
    })

    it('correctly formats DEGEN-like small delta values', () => {
      // Test the specific DEGEN case: $0.00370 - $0.00338 = $0.00032
      const result = formatChartFiatDelta({
        startingPrice: 0.00338,
        endingPrice: 0.0037,
        isStablecoin: false,
        formatNumberOrString: defaultFormatter,
      })
      expect(result.formatted).toBe('$0.00032')
      expect(result.rawDelta).toBeCloseTo(0.00032, 10)
      expect(result.belowThreshold).toBeUndefined()
    })

    it('calculates and formats positive delta for stablecoin', () => {
      const result = formatChartFiatDelta({
        startingPrice: 1.0,
        endingPrice: 1.003,
        isStablecoin: true,
        formatNumberOrString: defaultFormatter,
      })
      expect(result.formatted).toBe('$0.003')
      expect(result.rawDelta).toBeCloseTo(0.003, 5)
      expect(result.belowThreshold).toBeUndefined()
    })

    it('calculates and formats negative delta for stablecoin', () => {
      const result = formatChartFiatDelta({
        startingPrice: 1.0,
        endingPrice: 0.997,
        isStablecoin: true,
        formatNumberOrString: defaultFormatter,
      })
      expect(result.formatted).toBe('$0.003')
      expect(result.rawDelta).toBeCloseTo(-0.003, 5)
      expect(result.belowThreshold).toBeUndefined()
    })

    it('handles very small deltas for stablecoin', () => {
      const result = formatChartFiatDelta({
        startingPrice: 1.0,
        endingPrice: 1.0001,
        isStablecoin: true,
        formatNumberOrString: defaultFormatter,
      })
      expect(result.formatted).toBe('$0.00')
      expect(result.rawDelta).toBeCloseTo(0.0001, 5)
      expect(result.belowThreshold).toBeUndefined()
    })

    it('handles zero delta', () => {
      const result = formatChartFiatDelta({
        startingPrice: 100,
        endingPrice: 100,
        isStablecoin: false,
        formatNumberOrString: defaultFormatter,
      })
      expect(result.formatted).toBe('$0.00')
      expect(result.rawDelta).toBe(0)
      expect(result.belowThreshold).toBeUndefined()
    })

    it('uses custom currency', () => {
      const result = formatChartFiatDelta({
        startingPrice: 100,
        endingPrice: 150,
        currency: FiatCurrency.Euro,
        formatNumberOrString: defaultFormatter,
      })
      expect(result.formatted).toBe('EUR 50')
      expect(result.rawDelta).toBe(50)
      expect(result.belowThreshold).toBeUndefined()
    })

    it('handles below threshold values for normal crypto', () => {
      const result = formatChartFiatDelta({
        startingPrice: 1.0,
        endingPrice: 1.0000005,
        isStablecoin: false,
        formatNumberOrString: defaultFormatter,
      })
      expect(result.formatted).toBe('<$0.000001')
      expect(result.rawDelta).toBeCloseTo(0.0000005, 10)
      expect(result.belowThreshold).toBe(true)
    })

    it('handles multiple currencies', () => {
      const gbpResult = formatChartFiatDelta({
        startingPrice: 100,
        endingPrice: 175.25,
        currency: FiatCurrency.BritishPound,
        formatNumberOrString: defaultFormatter,
      })
      expect(gbpResult.formatted).toBe('£75.25')
      expect(gbpResult.rawDelta).toBe(75.25)

      const jpyResult = formatChartFiatDelta({
        startingPrice: 10000,
        endingPrice: 12500,
        currency: FiatCurrency.JapaneseYen,
        formatNumberOrString: defaultFormatter,
      })
      expect(jpyResult.formatted).toBe('¥2,500')
      expect(jpyResult.rawDelta).toBe(2500)

      const inrResult = formatChartFiatDelta({
        startingPrice: 5000,
        endingPrice: 7500.5,
        currency: FiatCurrency.IndianRupee,
        formatNumberOrString: defaultFormatter,
      })
      expect(inrResult.formatted).toBe('₹2,500.50')
      expect(inrResult.rawDelta).toBe(2500.5)
    })

    it('correctly sets belowThreshold flag', () => {
      // Should set belowThreshold for non-stablecoins
      const cryptoResult = formatChartFiatDelta({
        startingPrice: 1.0,
        endingPrice: 1.0000003,
        isStablecoin: false,
        formatNumberOrString: defaultFormatter,
      })
      expect(cryptoResult.belowThreshold).toBe(true)

      // Should NOT set belowThreshold for stablecoins
      const stableResult = formatChartFiatDelta({
        startingPrice: 1.0,
        endingPrice: 1.0000003,
        isStablecoin: true,
        formatNumberOrString: defaultFormatter,
      })
      expect(stableResult.belowThreshold).toBeUndefined()

      // Should NOT set belowThreshold when value is above threshold
      const aboveResult = formatChartFiatDelta({
        startingPrice: 1.0,
        endingPrice: 1.001,
        isStablecoin: false,
        formatNumberOrString: defaultFormatter,
      })
      expect(aboveResult.belowThreshold).toBeUndefined()
    })
  })
})
