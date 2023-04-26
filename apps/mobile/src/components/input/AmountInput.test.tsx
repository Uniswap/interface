import { convertToDotAsDecimalSeparator } from 'src/components/input/AmountInput'

describe(convertToDotAsDecimalSeparator, () => {
  const cases = [
    { input: '1234', output: '1234' },
    { input: '1234,', output: '1234.' },
    { input: '1.234', output: '1.234' },
    { input: '1,234', output: '1.234' },
    { input: '1.234,56', output: '1234.56' },
    { input: '1,234.56', output: '1234.56' },
    { input: '1,234,567', output: '1234567' },
    { input: '1.234.567', output: '1234567' },
    { input: '1.234.567,89', output: '1234567.89' },
    { input: '1,234,567.89', output: '1234567.89' },
  ]
  it.each(cases)('converts $input to $output', ({ input, output }) => {
    expect(convertToDotAsDecimalSeparator(input)).toBe(output)
  })
})
