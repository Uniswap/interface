import { convertScientificNotationToNumber } from 'utilities/src/format/convertScientificNotation'

describe('convertScientificNotationToNumber', () => {
  it('does not do anything to a regular number', () => {
    expect(convertScientificNotationToNumber('123456')).toEqual('123456')
  })

  it('converts a small number', () => {
    expect(convertScientificNotationToNumber('3e-2')).toEqual('0.03')
  })

  it('converts a large number', () => {
    expect(convertScientificNotationToNumber('3e+21')).toEqual('3000000000000000000000')
    expect(convertScientificNotationToNumber('3e+2')).toEqual('300')
  })

  it('converts a number with decimal places', () => {
    expect(convertScientificNotationToNumber('3.023e10')).toEqual('30230000000')
    expect(convertScientificNotationToNumber('1.0254e+22')).toEqual('10254000000000000000000')
  })

  it('handles scientific notation with a decimal point', () => {
    expect(convertScientificNotationToNumber('1.38557942e-8')).toEqual('0.0000000138557942')
  })

  it('handles zero in scientific notation', () => {
    expect(convertScientificNotationToNumber('0e0')).toEqual('0')
    expect(convertScientificNotationToNumber('0.0e5')).toEqual('0')
  })

  it('handles negative numbers in scientific notation', () => {
    expect(convertScientificNotationToNumber('-1.5e3')).toEqual('-1500')
    expect(convertScientificNotationToNumber('-2e-3')).toEqual('-0.002')
  })

  it('handles very small decimals without trailing zeros', () => {
    expect(convertScientificNotationToNumber('1.23e-10')).toEqual('0.000000000123')
  })

  it('returns original string for invalid scientific notation', () => {
    expect(convertScientificNotationToNumber('abc')).toEqual('abc')
    expect(convertScientificNotationToNumber('1.2.3e5')).toEqual('1.2.3e5')
    expect(convertScientificNotationToNumber('e5')).toEqual('e5')
    expect(convertScientificNotationToNumber('1.5e')).toEqual('1.5e')
    expect(convertScientificNotationToNumber('e')).toEqual('e')
    expect(convertScientificNotationToNumber('1ee5')).toEqual('1ee5')
    expect(convertScientificNotationToNumber('0x1e5')).toEqual('0x1e5')
  })

  it('handles numbers with positive exponents and plus sign', () => {
    expect(convertScientificNotationToNumber('1.5e+5')).toEqual('150000')
    expect(convertScientificNotationToNumber('1e+0')).toEqual('1')
  })

  it('handles numbers with lowercase and uppercase E', () => {
    expect(convertScientificNotationToNumber('1.5E-2')).toEqual('0.015')
    expect(convertScientificNotationToNumber('2E5')).toEqual('200000')
  })
})
