import { parseValue, replaceSeparators } from './AmountInput'

describe(replaceSeparators, () => {
  describe('it can strip grouping separators', () => {
    const inputParams = {
      groupingSeparator: ',',
      decimalSeparator: '.',
      groupingOverride: '',
      decimalOverride: '.',
    }
    const cases = [
      { input: { value: '1234', ...inputParams }, output: '1234' },
      { input: { value: '1234,', ...inputParams }, output: '1234' },
      { input: { value: '1.234', ...inputParams }, output: '1.234' },
      { input: { value: '1,234', ...inputParams }, output: '1234' },
      { input: { value: '1,234.56', ...inputParams }, output: '1234.56' },
      { input: { value: '1,234,567', ...inputParams }, output: '1234567' },
      { input: { value: '1,234,567.89', ...inputParams }, output: '1234567.89' },
    ]
    it.each(cases)('converts $input.value to $output', ({ input, output }) => {
      expect(replaceSeparators(input)).toBe(output)
    })
  })

  describe('it can handle common English to French cases', () => {
    const inputParams = {
      groupingSeparator: ',',
      decimalSeparator: '.',
      groupingOverride: ' ',
      decimalOverride: ',',
    }
    const cases = [
      { input: { value: '.1234', ...inputParams }, output: ',1234' },
      { input: { value: '1234', ...inputParams }, output: '1234' },
      { input: { value: '1234.', ...inputParams }, output: '1234,' },
      { input: { value: '1.234', ...inputParams }, output: '1,234' },
      { input: { value: '1,234', ...inputParams }, output: '1 234' },
      { input: { value: '1,234.56', ...inputParams }, output: '1 234,56' },
      { input: { value: '1,234,567', ...inputParams }, output: '1 234 567' },
      { input: { value: '1,234,567.89', ...inputParams }, output: '1 234 567,89' },
    ]
    it.each(cases)('converts $input.value to $output', ({ input, output }) => {
      expect(replaceSeparators(input)).toBe(output)
    })
  })

  describe('it can handle common French to English cases', () => {
    const inputParams = {
      groupingSeparator: ' ',
      decimalSeparator: ',',
      groupingOverride: ',',
      decimalOverride: '.',
    }
    const cases = [
      { input: { value: ',1234', ...inputParams }, output: '.1234' },
      { input: { value: '1234', ...inputParams }, output: '1234' },
      { input: { value: '1234,', ...inputParams }, output: '1234.' },
      { input: { value: '1,234', ...inputParams }, output: '1.234' },
      { input: { value: '1 234', ...inputParams }, output: '1,234' },
      { input: { value: '1 234,56', ...inputParams }, output: '1,234.56' },
      { input: { value: '1 234 567', ...inputParams }, output: '1,234,567' },
      { input: { value: '1 234 567,89', ...inputParams }, output: '1,234,567.89' },
    ]
    it.each(cases)('converts $input.value to $output', ({ input, output }) => {
      expect(replaceSeparators(input)).toBe(output)
    })
  })
})

describe(parseValue, () => {
  const defaultParams = {
    decimalSeparator: '.',
    groupingSeparator: ',',
    showCurrencySign: false,
    nativeKeyboardDecimalSeparator: '.',
  }

  it('trims whitespaces', () => {
    expect(
      parseValue({
        value: ' 1234 ',
        ...defaultParams,
      })
    ).toBe('1234')
  })

  it('removes thousands separators', () => {
    expect(
      parseValue({
        value: '1,234.56',
        ...defaultParams,
      })
    ).toBe('1234.56')

    expect(
      parseValue({
        value: '1.234,56',
        ...defaultParams,
        decimalSeparator: ',',
        groupingSeparator: '.',
      })
    ).toBe('1234.56')

    expect(
      parseValue({
        value: '1 234.56',
        ...defaultParams,
        decimalSeparator: '.',
        groupingSeparator: ' ',
      })
    ).toBe('1234.56')
  })

  it('removes non-numeric characters', () => {
    expect(
      parseValue({
        value: ' example $1,234,567.123456789 example ',
        ...defaultParams,
      })
    ).toBe('1234567.123456789')
  })

  it('truncates decimals according to maxDecimals', () => {
    expect(
      parseValue({
        value: '1,234.123456789123456789 WBTC',
        ...defaultParams,
        maxDecimals: 8,
      })
    ).toBe('1234.12345678')

    expect(
      parseValue({
        value: '1,234.123456789123456789123456789 ETH',
        ...defaultParams,
        maxDecimals: 18,
      })
    ).toBe('1234.123456789123456789')
  })
})
