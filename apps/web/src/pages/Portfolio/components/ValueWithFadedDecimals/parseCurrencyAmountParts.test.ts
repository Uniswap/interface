import { parseCurrencyAmountParts } from 'pages/Portfolio/components/ValueWithFadedDecimals/parseCurrencyAmountParts'

describe('parseCurrencyAmountParts', () => {
  describe('with symbol at front', () => {
    it('parses USD values correctly', () => {
      const result = parseCurrencyAmountParts({
        value: '$1,234.56',
        fullSymbol: '$',
        symbolAtFront: true,
        decimalSeparator: '.',
      })
      expect(result).toEqual({
        prefixSymbol: '$',
        wholeNumber: '1,234',
        decimalNumber: '56',
        decimalSeparator: '.',
        suffixSymbol: '',
        suffix: '',
      })
    })

    it('parses values without decimals', () => {
      const result = parseCurrencyAmountParts({
        value: '$1,234',
        fullSymbol: '$',
        symbolAtFront: true,
        decimalSeparator: '.',
      })
      expect(result).toEqual({
        prefixSymbol: '$',
        wholeNumber: '1,234',
        decimalNumber: '',
        decimalSeparator: '.',
        suffixSymbol: '',
        suffix: '',
      })
    })

    it('parses values with decimal separator but no decimals', () => {
      const result = parseCurrencyAmountParts({
        value: '$1,234.',
        fullSymbol: '$',
        symbolAtFront: true,
        decimalSeparator: '.',
      })
      expect(result).toEqual({
        prefixSymbol: '$',
        wholeNumber: '1,234',
        decimalNumber: '',
        decimalSeparator: '.',
        suffixSymbol: '',
        suffix: '',
      })
    })

    it('parses values with suffix after decimals', () => {
      const result = parseCurrencyAmountParts({
        value: '$1,234.56K',
        fullSymbol: '$',
        symbolAtFront: true,
        decimalSeparator: '.',
      })
      expect(result).toEqual({
        prefixSymbol: '$',
        wholeNumber: '1,234',
        decimalNumber: '56',
        decimalSeparator: '.',
        suffixSymbol: '',
        suffix: 'K',
      })
    })

    it('handles values without symbol', () => {
      const result = parseCurrencyAmountParts({
        value: '1,234.56',
        fullSymbol: '$',
        symbolAtFront: true,
        decimalSeparator: '.',
      })
      expect(result).toEqual({
        prefixSymbol: '',
        wholeNumber: '1,234',
        decimalNumber: '56',
        decimalSeparator: '.',
        suffixSymbol: '',
        suffix: '',
      })
    })
  })

  describe('with symbol at end', () => {
    it('parses EUR values correctly', () => {
      const result = parseCurrencyAmountParts({
        value: '1,234.56€',
        fullSymbol: '€',
        symbolAtFront: false,
        decimalSeparator: '.',
      })
      expect(result).toEqual({
        prefixSymbol: '',
        wholeNumber: '1,234',
        decimalNumber: '56',
        decimalSeparator: '.',
        suffixSymbol: '€',
        suffix: '',
      })
    })

    it('parses values without decimals', () => {
      const result = parseCurrencyAmountParts({
        value: '1,234€',
        fullSymbol: '€',
        symbolAtFront: false,
        decimalSeparator: '.',
      })
      expect(result).toEqual({
        prefixSymbol: '',
        wholeNumber: '1,234',
        decimalNumber: '',
        decimalSeparator: '.',
        suffixSymbol: '€',
        suffix: '',
      })
    })

    it('parses values with suffix after decimals', () => {
      const result = parseCurrencyAmountParts({
        value: '1,234.56K€',
        fullSymbol: '€',
        symbolAtFront: false,
        decimalSeparator: '.',
      })
      expect(result).toEqual({
        prefixSymbol: '',
        wholeNumber: '1,234',
        decimalNumber: '56',
        decimalSeparator: '.',
        suffixSymbol: '€',
        suffix: 'K',
      })
    })

    it('handles values without symbol', () => {
      const result = parseCurrencyAmountParts({
        value: '1,234.56',
        fullSymbol: '€',
        symbolAtFront: false,
        decimalSeparator: '.',
      })
      expect(result).toEqual({
        prefixSymbol: '',
        wholeNumber: '1,234',
        decimalNumber: '56',
        decimalSeparator: '.',
        suffixSymbol: '',
        suffix: '',
      })
    })
  })

  describe('with different decimal separators', () => {
    it('handles comma as decimal separator', () => {
      const result = parseCurrencyAmountParts({
        value: '$1.234,56',
        fullSymbol: '$',
        symbolAtFront: true,
        decimalSeparator: ',',
      })
      expect(result).toEqual({
        prefixSymbol: '$',
        wholeNumber: '1.234',
        decimalNumber: '56',
        decimalSeparator: ',',
        suffixSymbol: '',
        suffix: '',
      })
    })

    it('handles space as decimal separator', () => {
      const result = parseCurrencyAmountParts({
        value: '$1,234 56',
        fullSymbol: '$',
        symbolAtFront: true,
        decimalSeparator: ' ',
      })
      expect(result).toEqual({
        prefixSymbol: '$',
        wholeNumber: '1,234',
        decimalNumber: '56',
        decimalSeparator: ' ',
        suffixSymbol: '',
        suffix: '',
      })
    })
  })

  describe('edge cases', () => {
    it('handles empty string', () => {
      const result = parseCurrencyAmountParts({
        value: '',
        fullSymbol: '$',
        symbolAtFront: true,
        decimalSeparator: '.',
      })
      expect(result).toEqual({
        prefixSymbol: '',
        wholeNumber: '',
        decimalNumber: '',
        decimalSeparator: '.',
        suffixSymbol: '',
        suffix: '',
      })
    })

    it('handles only symbol', () => {
      const result = parseCurrencyAmountParts({
        value: '$',
        fullSymbol: '$',
        symbolAtFront: true,
        decimalSeparator: '.',
      })
      expect(result).toEqual({
        prefixSymbol: '$',
        wholeNumber: '',
        decimalNumber: '',
        decimalSeparator: '.',
        suffixSymbol: '',
        suffix: '',
      })
    })

    it('handles only decimal separator', () => {
      const result = parseCurrencyAmountParts({
        value: '.',
        fullSymbol: '$',
        symbolAtFront: true,
        decimalSeparator: '.',
      })
      expect(result).toEqual({
        prefixSymbol: '',
        wholeNumber: '',
        decimalNumber: '',
        decimalSeparator: '.',
        suffixSymbol: '',
        suffix: '',
      })
    })

    it('handles multiple decimal separators', () => {
      const result = parseCurrencyAmountParts({
        value: '$1.234.56',
        fullSymbol: '$',
        symbolAtFront: true,
        decimalSeparator: '.',
      })
      expect(result).toEqual({
        prefixSymbol: '$',
        wholeNumber: '1',
        decimalNumber: '234',
        decimalSeparator: '.',
        suffixSymbol: '',
        suffix: '.56',
      })
    })

    it('handles non-numeric characters in decimal part', () => {
      const result = parseCurrencyAmountParts({
        value: '$1,234.56abc',
        fullSymbol: '$',
        symbolAtFront: true,
        decimalSeparator: '.',
      })
      expect(result).toEqual({
        prefixSymbol: '$',
        wholeNumber: '1,234',
        decimalNumber: '56',
        decimalSeparator: '.',
        suffixSymbol: '',
        suffix: 'abc',
      })
    })
  })

  describe('round-trip reconstruction', () => {
    const testCases = [
      { value: '$1,234.56', symbol: '$', symbolAtFront: true, decimalSeparator: '.', expected: '$1,234.56' },
      { value: '1,234.56€', symbol: '€', symbolAtFront: false, decimalSeparator: '.', expected: '1,234.56€' },
      { value: '$1,234.56K', symbol: '$', symbolAtFront: true, decimalSeparator: '.', expected: '$1,234.56K' },
      { value: '1,234.56K€', symbol: '€', symbolAtFront: false, decimalSeparator: '.', expected: '1,234.56K€' },
      { value: '$1,234', symbol: '$', symbolAtFront: true, decimalSeparator: '.', expected: '$1,234' },
      { value: '1,234€', symbol: '€', symbolAtFront: false, decimalSeparator: '.', expected: '1,234€' },
      { value: '$1,234.', symbol: '$', symbolAtFront: true, decimalSeparator: '.', expected: '$1,234' },
      { value: '1,234.€', symbol: '€', symbolAtFront: false, decimalSeparator: '.', expected: '1,234€' },
      { value: '1,234.56', symbol: '$', symbolAtFront: true, decimalSeparator: '.', expected: '1,234.56' },
      { value: '$1.234,56', symbol: '$', symbolAtFront: true, decimalSeparator: ',', expected: '$1.234,56' },
    ]

    testCases.forEach(({ value, symbol, symbolAtFront, decimalSeparator, expected }) => {
      it(`reconstructs "${value}" correctly`, () => {
        const parsed = parseCurrencyAmountParts({ value, fullSymbol: symbol, symbolAtFront, decimalSeparator })

        // Reconstruct the original value
        const reconstructed =
          parsed.prefixSymbol +
          parsed.wholeNumber +
          (parsed.decimalNumber ? decimalSeparator + parsed.decimalNumber : '') +
          parsed.suffix +
          parsed.suffixSymbol

        expect(reconstructed).toBe(expected)
      })
    })
  })
})
