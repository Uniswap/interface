import { utils, wordlists } from 'ethers'
import { AppTFunction } from 'ui/src/i18n/types'
import { normalizeTextInput } from 'utilities/src/primitives/string'
import { MNEMONIC_LENGTH_MAX, MNEMONIC_LENGTH_MIN } from 'wallet/src/constants/accounts'

export enum MnemonicValidationError {
  InvalidWord = 'InvalidWord',
  NotEnoughWords = 'NotEnoughWords',
  TooManyWords = 'TooManyWords',
  InvalidPhrase = 'InvalidPhrase',
}

export function translateMnemonicErrorMessage({
  error,
  invalidWord,
  t,
}: {
  error: MnemonicValidationError
  invalidWord: string | undefined
  t: AppTFunction
}): string {
  switch (error) {
    case MnemonicValidationError.InvalidPhrase:
      return t('account.recoveryPhrase.error.invalid')
    case MnemonicValidationError.InvalidWord:
      return t('account.recoveryPhrase.error.invalidWord', { word: invalidWord })
    case MnemonicValidationError.TooManyWords:
    case MnemonicValidationError.NotEnoughWords:
      return t('account.recoveryPhrase.error.phraseLength')
    default:
      throw new Error(`Unhandled MnemonicValidationError case: ${error}`)
  }
}

// Validate if word is part of the BIP-39 word set [https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki]
export function validateSetOfWords(mnemonic?: string): {
  error?: MnemonicValidationError
  invalidWord?: string
  invalidWordCount?: number
  isValidLength: boolean // we need this to enable/disable buttons for all error return types
} {
  if (!mnemonic) {
    return { error: MnemonicValidationError.NotEnoughWords, isValidLength: false }
  }

  const formatted = normalizeTextInput(mnemonic)
  const split = formatted.split(' ')
  const isValidLength = split.length >= MNEMONIC_LENGTH_MIN && split.length <= MNEMONIC_LENGTH_MAX

  const invalidWords = split.filter((item) => isValidMnemonicWord(item))
  if (invalidWords.length) {
    return {
      error: MnemonicValidationError.InvalidWord,
      invalidWord: invalidWords.at(-1),
      invalidWordCount: invalidWords.length,
      isValidLength,
    }
  }

  if (split.length < MNEMONIC_LENGTH_MIN) {
    return { error: MnemonicValidationError.NotEnoughWords, isValidLength }
  }

  if (split.length > MNEMONIC_LENGTH_MAX) {
    return { error: MnemonicValidationError.TooManyWords, isValidLength }
  }

  return { isValidLength }
}

// Validate phrase by verifying the checksum
export function validateMnemonic(mnemonic?: string): {
  error?: MnemonicValidationError
  invalidWord?: string
  invalidWordCount?: number
  validMnemonic?: string
} {
  const { error, invalidWord, invalidWordCount } = validateSetOfWords(mnemonic)
  if (error) {
    return { error, invalidWord, invalidWordCount }
  }

  const formatted = normalizeTextInput(mnemonic ?? '')
  if (!utils.isValidMnemonic(formatted)) {
    return { error: MnemonicValidationError.InvalidPhrase }
  }

  return { validMnemonic: formatted }
}

// Validate individual mnemonic word
export function isValidMnemonicWord(word: string): boolean {
  return word.length > 0 && wordlists.en?.getWordIndex(word) === -1
}

// Check if phrase has trailing whitespace, indicating the user is done typing the previous word.
export function userFinishedTypingWord(mnemonic: string | undefined): boolean {
  if (!mnemonic) {
    return false
  }
  const lastChar = mnemonic[mnemonic.length - 1]
  return lastChar === ' '
}
