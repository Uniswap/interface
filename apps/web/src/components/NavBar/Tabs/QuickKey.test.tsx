import sourceTranslations from 'uniswap/src/i18n/locales/source/en-US.json'

describe('navigation quick keys', () => {
  const keys = Object.keys(sourceTranslations).filter((key) => key.startsWith('quickKey'))

  it('should be one character in length', () => {
    keys.forEach((key) => {
      const translation = (sourceTranslations as { [key: string]: string })[key]
      expect(translation).toBeTruthy()
      expect(translation.length).toEqual(1)
    })
  })

  it('should all be unique', () => {
    const hotKeyValues = keys.map((key) => (sourceTranslations as { [key: string]: string })[key])
    const hasDuplicateKeys = hotKeyValues.some((item, index) => hotKeyValues.includes(item, index + 1))
    expect(hasDuplicateKeys).toEqual(false)
  })
})
