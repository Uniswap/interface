import { utils } from 'ethers'
import { TFunction } from 'i18next'
import { MNEMONIC_LENGTH_MAX, MNEMONIC_LENGTH_MIN } from 'src/constants/accounts'

export function isValidMnemonic(
  mnemonic: Nullable<string>,
  t: TFunction
): {
  valid: boolean
  errorText?: string
} {
  if (!mnemonic)
    return {
      valid: false,
      errorText: t('Enter value'),
    }
  const formatted = normalizeMnemonic(mnemonic)
  const split = formatted.split(' ')

  if (split.length < MNEMONIC_LENGTH_MIN || split.length > MNEMONIC_LENGTH_MAX)
    return {
      valid: false,
      errorText: t('Recovery phrases must be 12-24 words'),
    }

  if (!utils.isValidMnemonic(formatted)) {
    return {
      valid: false,
      errorText: t('Invalid phrase'),
    }
  }
  return {
    valid: true,
  }
}

export function isValidDerivationPath(derivationPath: string) {
  if (!derivationPath) return false
  const split = derivationPath.trim().split('/')
  // TODO validate each path segment individually here
  return split[0] === 'm' && split.length === 6
}

export function isValidMnemonicLocale(locale: string) {
  if (!locale) return false
  // Only english locales are currently supported
  if (locale !== 'en') return false
  return true
}

// Format the mnemonic to handle extra whitespace
// May need more additions here as other languages are supported
export function normalizeMnemonic(mnemonic: string) {
  if (!mnemonic) return ''
  // Trim and replace all whitespaces with a single space
  return mnemonic.trim().replace(/\s+/g, ' ')
}
