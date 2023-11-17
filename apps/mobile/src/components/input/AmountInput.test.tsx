import { replaceSeparators } from 'src/components/input/AmountInput'

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
