import { wordlists, utils } from 'ethers'
import { TFunction } from 'i18next'
import { MNEMONIC_LENGTH_MAX, MNEMONIC_LENGTH_MIN } from 'src/constants/accounts'

// Validate if word is part of the BIP-39 word set [https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki]
export function isValidWord(
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
  const invalidWords = split.filter((item) => wordlists.en.getWordIndex(item) === -1)

  if (invalidWords.length) {
    return {
      valid: false,
      errorText: invalidWords.length > 1 ? t('Invalid words') : t('Invalid word'),
    }
  }

  if (split.length < MNEMONIC_LENGTH_MIN || split.length > MNEMONIC_LENGTH_MAX)
    return {
      valid: false,
      errorText: t('Recovery phrases must be 12-24 words'),
    }

  return {
    valid: true,
  }
}

// Validate phrase by verifying the checksum
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
