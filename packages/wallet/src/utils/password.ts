import { t } from 'i18next'
import { ColorTokens } from 'ui/src'
import zxcvbn from 'zxcvbn'

export enum PasswordStrength {
  NONE, // if there is no input or we don't want it to be displayed yet
  WEAK,
  MEDIUM,
  STRONG,
}

export const PASSWORD_VALIDATION_DEBOUNCE_MS = 750

export function isPasswordStrongEnough({
  minStrength,
  currentStrength,
}: {
  minStrength: PasswordStrength
  currentStrength: PasswordStrength
}): boolean {
  return currentStrength >= minStrength
}

export function getPasswordStrength(password: string): PasswordStrength {
  const { score } = zxcvbn(password)

  if (!password) {
    return PasswordStrength.NONE
  }

  if (score < 2) {
    return PasswordStrength.WEAK
  } else if (score < 4) {
    return PasswordStrength.MEDIUM
  } else {
    return PasswordStrength.STRONG
  }
}

export function getPasswordStrengthTextAndColor(strength: PasswordStrength): {
  text: string
  color: ColorTokens
} {
  switch (strength) {
    case PasswordStrength.WEAK:
      return { text: t('common.input.password.strength.weak'), color: '$statusCritical' }
    case PasswordStrength.MEDIUM:
      return {
        text: t('common.input.password.strength.medium'),
        color: '$DEP_accentWarning',
      }
    case PasswordStrength.STRONG:
      return { text: t('common.input.password.strength.strong'), color: '$statusSuccess' }
    default:
      return { text: '', color: '$neutral1' }
  }
}
