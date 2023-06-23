import { isValidPassword } from './password'

describe(isValidPassword, () => {
  it('returns true for valid password', () => {
    expect(isValidPassword('a_very_long_password').valid).toBeTruthy()
  })

  it('returns false for invalid passwords', () => {
    expect(isValidPassword('short').valid).toBeFalsy()
    expect(isValidPassword('short').validationErrorString).toBe('Password is too short.')
  })
})
