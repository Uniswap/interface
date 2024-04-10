import i18n from 'wallet/src/i18n/i18n'
import { MnemonicValidationError, translateMnemonicErrorMessage } from 'wallet/src/utils/mnemonics'

describe(translateMnemonicErrorMessage, () => {
  it('correct invalid phrase message', () => {
    expect(
      translateMnemonicErrorMessage(MnemonicValidationError.InvalidPhrase, undefined, i18n.t)
    ).toBe('Invalid phrase')
  })

  it('correct invalid word message', () => {
    const invalidWord = 'gibberish'
    expect(
      translateMnemonicErrorMessage(MnemonicValidationError.InvalidWord, invalidWord, i18n.t)
    ).toBe(`Invalid word: ${invalidWord}`)
  })

  it('correct incorrect number of words message', () => {
    expect(
      translateMnemonicErrorMessage(MnemonicValidationError.TooManyWords, undefined, i18n.t)
    ).toBe('Recovery phrase must be 12-24 words')
    expect(
      translateMnemonicErrorMessage(MnemonicValidationError.NotEnoughWords, undefined, i18n.t)
    ).toBe('Recovery phrase must be 12-24 words')
  })
})
