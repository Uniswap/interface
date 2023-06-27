const PASSWORD_LENGTH_MIN = 8

interface PasswordValidationResult {
  valid: boolean
  validationErrorString?: string
}

export function validatePassword(password: string): PasswordValidationResult {
  const validLength = password.length >= PASSWORD_LENGTH_MIN
  if (validLength) {
    return { valid: true }
  } else {
    return {
      valid: false,
      validationErrorString: 'Password is too short.',
    }
  }
}
