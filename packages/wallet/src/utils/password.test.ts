import i18n from 'uniswap/src/i18n'
import {
  getPasswordStrength,
  getPasswordStrengthTextAndColor,
  isPasswordStrongEnough,
  PasswordStrength,
} from 'wallet/src/utils/password'

describe(isPasswordStrongEnough, () => {
  it('returns true for equal strengths', () => {
    expect(
      isPasswordStrongEnough({
        minStrength: PasswordStrength.NONE,
        currentStrength: PasswordStrength.NONE,
      }),
    ).toBeTruthy()
    expect(
      isPasswordStrongEnough({
        minStrength: PasswordStrength.MEDIUM,
        currentStrength: PasswordStrength.MEDIUM,
      }),
    ).toBeTruthy()
  })

  it('returns false for less strength', () => {
    expect(
      isPasswordStrongEnough({
        minStrength: PasswordStrength.MEDIUM,
        currentStrength: PasswordStrength.NONE,
      }),
    ).toBeFalsy()
    expect(
      isPasswordStrongEnough({
        minStrength: PasswordStrength.MEDIUM,
        currentStrength: PasswordStrength.WEAK,
      }),
    ).toBeFalsy()
  })

  it('returns true for greater strengths', () => {
    expect(
      isPasswordStrongEnough({
        minStrength: PasswordStrength.NONE,
        currentStrength: PasswordStrength.NONE,
      }),
    ).toBeTruthy()
    expect(
      isPasswordStrongEnough({
        minStrength: PasswordStrength.NONE,
        currentStrength: PasswordStrength.NONE,
      }),
    ).toBeTruthy()
  })
})

describe(getPasswordStrength, () => {
  it('returns NONE for empty string', () => {
    expect(getPasswordStrength('')).toBe(PasswordStrength.NONE)
  })

  it('returns WEAK for score less than 2', () => {
    expect(getPasswordStrength('short')).toBe(PasswordStrength.WEAK)
    expect(getPasswordStrength('aa')).toBe(PasswordStrength.WEAK)
  })

  it('returns MEDIUM for score less than 4', () => {
    expect(getPasswordStrength('thisissosecure')).toBe(PasswordStrength.MEDIUM)
  })

  it('returns STRONG for score greater than or equal to 4', () => {
    expect(getPasswordStrength('this is so secure!')).toBe(PasswordStrength.STRONG)
  })
})

describe(getPasswordStrengthTextAndColor, () => {
  it('returns text and color for strength', () => {
    expect(getPasswordStrengthTextAndColor(i18n.t, PasswordStrength.WEAK)).toEqual({
      text: 'Weak',
      color: '$statusCritical',
    })
    expect(getPasswordStrengthTextAndColor(i18n.t, PasswordStrength.MEDIUM)).toEqual({
      text: 'Medium',
      color: '$statusWarning',
    })
    expect(getPasswordStrengthTextAndColor(i18n.t, PasswordStrength.STRONG)).toEqual({
      text: 'Strong',
      color: '$statusSuccess',
    })
  })

  it('returns empty text and neutral color for other strengths', () => {
    expect(getPasswordStrengthTextAndColor(i18n.t, PasswordStrength.NONE)).toEqual({
      text: '',
      color: '$neutral1',
    })
  })
})
