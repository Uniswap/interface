import i18n from 'uniswap/src/i18n'
import { isValidMnemonicWord, MnemonicValidationError, translateMnemonicErrorMessage } from 'wallet/src/utils/mnemonics'

describe(translateMnemonicErrorMessage, () => {
  it('correct invalid phrase message', () => {
    expect(
      translateMnemonicErrorMessage({
        error: MnemonicValidationError.InvalidPhrase,
        invalidWord: undefined,
        t: i18n.t,
      }),
    ).toBe('Invalid phrase')
  })

  it('correct invalid word message', () => {
    const invalidWord = 'gibberish'
    expect(
      translateMnemonicErrorMessage({
        error: MnemonicValidationError.InvalidWord,
        invalidWord,
        t: i18n.t,
      }),
    ).toBe(`Invalid word: ${invalidWord}`)
  })

  it('correct incorrect number of words message', () => {
    expect(
      translateMnemonicErrorMessage({
        error: MnemonicValidationError.TooManyWords,
        invalidWord: undefined,
        t: i18n.t,
      }),
    ).toBe('Recovery phrase must be 12-24 words')
    expect(
      translateMnemonicErrorMessage({
        error: MnemonicValidationError.NotEnoughWords,
        invalidWord: undefined,
        t: i18n.t,
      }),
    ).toBe('Recovery phrase must be 12-24 words')
  })
})

describe(isValidMnemonicWord, () => {
  describe('valid BIP-39 words', () => {
    it('should return true for valid words from the beginning of the wordlist', () => {
      expect(isValidMnemonicWord('abandon')).toBe(true)
      expect(isValidMnemonicWord('ability')).toBe(true)
      expect(isValidMnemonicWord('able')).toBe(true)
    })

    it('should return true for valid words from the middle of the wordlist', () => {
      expect(isValidMnemonicWord('fabric')).toBe(true)
      expect(isValidMnemonicWord('face')).toBe(true)
      expect(isValidMnemonicWord('faculty')).toBe(true)
    })

    it('should return true for valid words from the end of the wordlist', () => {
      expect(isValidMnemonicWord('zone')).toBe(true)
      expect(isValidMnemonicWord('zoo')).toBe(true)
    })

    it('should return true for commonly used mnemonic words', () => {
      expect(isValidMnemonicWord('apple')).toBe(true)
      expect(isValidMnemonicWord('banana')).toBe(true)
      expect(isValidMnemonicWord('cherry')).toBe(true)
      expect(isValidMnemonicWord('dragon')).toBe(true)
      expect(isValidMnemonicWord('elephant')).toBe(true)
      expect(isValidMnemonicWord('forest')).toBe(true)
    })
  })

  describe('invalid words', () => {
    it('should return false for words not in the BIP-39 wordlist', () => {
      expect(isValidMnemonicWord('gibberish')).toBe(false)
      expect(isValidMnemonicWord('notaword')).toBe(false)
      expect(isValidMnemonicWord('foobar')).toBe(false)
    })

    it('should return false for empty string', () => {
      expect(isValidMnemonicWord('')).toBe(false)
    })

    it('should return false for words with numbers', () => {
      expect(isValidMnemonicWord('word123')).toBe(false)
      expect(isValidMnemonicWord('123word')).toBe(false)
      expect(isValidMnemonicWord('123')).toBe(false)
    })

    it('should return false for words with special characters', () => {
      expect(isValidMnemonicWord('word!')).toBe(false)
      expect(isValidMnemonicWord('word@home')).toBe(false)
      expect(isValidMnemonicWord('word-hyphen')).toBe(false)
    })

    it('should return false for words with uppercase letters (BIP-39 is lowercase only)', () => {
      // Even though 'abandon' is valid, 'Abandon' should not be
      expect(isValidMnemonicWord('Abandon')).toBe(false)
      expect(isValidMnemonicWord('ABANDON')).toBe(false)
      expect(isValidMnemonicWord('Apple')).toBe(false)
    })

    it('should return false for words with extra whitespace', () => {
      expect(isValidMnemonicWord(' abandon')).toBe(false)
      expect(isValidMnemonicWord('abandon ')).toBe(false)
      expect(isValidMnemonicWord(' abandon ')).toBe(false)
    })

    it('should return false for valid words with typos', () => {
      expect(isValidMnemonicWord('abandun')).toBe(false) // typo of 'abandon'
      expect(isValidMnemonicWord('appl')).toBe(false) // typo of 'apple'
      expect(isValidMnemonicWord('banan')).toBe(false) // typo of 'banana'
    })
  })

  describe('edge cases', () => {
    it('should return false for single character strings', () => {
      expect(isValidMnemonicWord('a')).toBe(false)
      expect(isValidMnemonicWord('z')).toBe(false)
    })

    it('should return false for very long strings', () => {
      expect(isValidMnemonicWord('verylongwordthatdoesnotexistinthebip39wordlist')).toBe(false)
    })

    it('should handle unicode characters correctly', () => {
      expect(isValidMnemonicWord('café')).toBe(false)
      expect(isValidMnemonicWord('naïve')).toBe(false)
      expect(isValidMnemonicWord('日本語')).toBe(false)
    })
  })
})
