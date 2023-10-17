import zxcvbn from 'zxcvbn'

export interface PasswordValidationResult {
  valid: boolean
  validationErrorString?: string
}

export function validatePassword(password: string): PasswordValidationResult {
  const {
    score,
    feedback: { warning },
  } = zxcvbn(password)
  if (score >= 4) {
    return { valid: true }
  }
  return {
    valid: false,
    validationErrorString: warning,
  }
}
