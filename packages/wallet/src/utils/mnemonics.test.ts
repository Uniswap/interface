import { MnemonicValidationError, translateMnemonicErrorMessage } from 'wallet/src/utils/mnemonics'

describe(translateMnemonicErrorMessage, () => {
  const t = (str: string): string => str

  it('correct invalid phrase message', () => {
    expect(translateMnemonicErrorMessage(MnemonicValidationError.InvalidPhrase, undefined, t)).toBe(
      'Invalid phrase'
    )
  })

  it('correct invalid word message', () => {
    expect(translateMnemonicErrorMessage(MnemonicValidationError.InvalidWord, 't', t)).toBe(
      'Invalid word: {{word}}'
    )
  })

  it('correct incorrect number of words message', () => {
    expect(translateMnemonicErrorMessage(MnemonicValidationError.TooManyWords, undefined, t)).toBe(
      'Recovery phrase must be 12-24 words'
    )
    expect(
      translateMnemonicErrorMessage(MnemonicValidationError.NotEnoughWords, undefined, t)
    ).toBe('Recovery phrase must be 12-24 words')
  })
})
