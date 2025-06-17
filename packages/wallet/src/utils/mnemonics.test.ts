import i18n from 'uniswap/src/i18n'
import { MnemonicValidationError, translateMnemonicErrorMessage } from 'wallet/src/utils/mnemonics'

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
