import JSBI from 'jsbi'
import { convertScientificNotationToNumber } from 'src/features/notifications/utils'

describe('convertScientificNotationToNumber', () => {
  it('does not do anything to a regular number', () => {
    expect(convertScientificNotationToNumber('123456')).toBe('123456')
  })

  it('converts a small number', () => {
    expect(convertScientificNotationToNumber('3e-2')).toBe('0.03')
  })

  it('converts a large number', () => {
    expect(convertScientificNotationToNumber('3e+21')).toEqual(
      JSBI.BigInt('3000000000000000000000')
    )
    expect(convertScientificNotationToNumber('3e+2')).toEqual(JSBI.BigInt('300'))
  })

  it('converts a number with decimal places', () => {
    expect(convertScientificNotationToNumber('3.023e10')).toEqual(JSBI.BigInt('30230000000'))
    expect(convertScientificNotationToNumber('1.0254e+22')).toEqual(
      JSBI.BigInt('10254000000000000000000')
    )
  })
})
