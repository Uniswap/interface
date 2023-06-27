import { validatePassword } from './password'

describe(validatePassword, () => {
  it('returns true for valid password', () => {
    expect(validatePassword('a_very_long_password').valid).toBeTruthy()
  })

  it('returns false for invalid passwords', () => {
    expect(validatePassword('short').valid).toBeFalsy()
    expect(validatePassword('short').validationErrorString).toBe('Password is too short.')
  })
})
