import { Language } from 'uniswap/src/features/language/constants'
import { getTranslation } from 'uniswap/src/features/language/getTranslation'

describe(getTranslation, () => {
  const translations = {
    'es-ES': 'Descripción en español.',
    'fr-FR': 'Description en français.',
    'zh-Hans': '简体中文描述。',
    'zh-Hant': '繁體中文描述。',
    vi: 'Mô tả tiếng Việt.',
  }

  it('returns undefined without translations or for English', () => {
    expect(getTranslation(undefined, Language.French)).toBeUndefined()
    expect(getTranslation({}, Language.French)).toBeUndefined()
    expect(getTranslation(translations, Language.English)).toBeUndefined()
  })

  it('matches the exact locale tag', () => {
    expect(getTranslation(translations, Language.French)).toBe('Description en français.')
    expect(getTranslation(translations, Language.ChineseSimplified)).toBe('简体中文描述。')
    expect(getTranslation(translations, Language.ChineseTraditional)).toBe('繁體中文描述。')
  })

  it('matches keys case-insensitively', () => {
    expect(getTranslation({ 'FR-fr': 'Bonjour' }, Language.French)).toBe('Bonjour')
  })

  it('falls back to the bare language subtag key', () => {
    expect(getTranslation(translations, Language.Vietnamese)).toBe('Mô tả tiếng Việt.')
  })

  it('falls back to a regional variant sharing the language subtag', () => {
    expect(getTranslation(translations, Language.SpanishLatam)).toBe('Descripción en español.')
    expect(getTranslation(translations, Language.SpanishUnitedStates)).toBe('Descripción en español.')
  })

  it('returns undefined when no key shares the language subtag', () => {
    expect(getTranslation(translations, Language.Japanese)).toBeUndefined()
  })

  it('treats an empty translation string as missing', () => {
    expect(getTranslation({ 'ja-JP': '' }, Language.Japanese)).toBeUndefined()
  })
})
