import { normalizeTwitterHandle } from 'uniswap/src/features/dataApi/tokenDetails/tokenMetadataUtils'
import { getTranslatedDescription } from 'uniswap/src/features/dataApi/tokenDetails/tokenMetadataUtils'
import { Language } from 'uniswap/src/features/language/constants'

describe(normalizeTwitterHandle, () => {
  it.each([
    ['bare handle', 'bonk_inu', 'bonk_inu'],
    ['@-prefixed handle', '@bonk_inu', 'bonk_inu'],
    ['surrounding whitespace', '  bonk_inu  ', 'bonk_inu'],
    ['x.com profile URL', 'https://x.com/bonk_inu', 'bonk_inu'],
    ['twitter.com profile URL', 'https://twitter.com/bonk_inu', 'bonk_inu'],
    ['www + http URL', 'http://www.x.com/bonk_inu', 'bonk_inu'],
    ['uppercase domain', 'HTTPS://X.COM/bonk_inu', 'bonk_inu'],
    ['protocol-less URL', 'x.com/bonk_inu', 'bonk_inu'],
    ['trailing slash', 'https://x.com/bonk_inu/', 'bonk_inu'],
    ['query tail', 'https://x.com/bonk_inu?ref=abc', 'bonk_inu'],
    ['hash tail', 'https://x.com/bonk_inu#top', 'bonk_inu'],
    ['deep profile path', 'https://x.com/bonk_inu/status/123', 'bonk_inu'],
  ])('extracts the handle from a %s', (_case, input, expected) => {
    expect(normalizeTwitterHandle(input)).toBe(expected)
  })

  // Invalid inputs must resolve to undefined so consumers hide the link instead of building a broken URL
  it.each([
    ['undefined', undefined],
    ['empty string', ''],
    ['non-X domain URL', 'https://example.com/bonk_inu'],
    ['unhandled subdomain', 'https://mobile.twitter.com/bonk_inu'],
    ['handle over 15 chars', 'a'.repeat(16)],
    ['disallowed characters', 'bonk-inu'],
    ['free text', 'not a handle'],
  ])('returns undefined for %s', (_case, input) => {
    expect(normalizeTwitterHandle(input)).toBeUndefined()
  })
})

describe(getTranslatedDescription, () => {
  const translations = {
    'es-ES': 'Descripción en español.',
    'fr-FR': 'Description en français.',
    'zh-Hans': '简体中文描述。',
    'zh-Hant': '繁體中文描述。',
    vi: 'Mô tả tiếng Việt.',
  }

  it('returns undefined without translations or for English', () => {
    expect(getTranslatedDescription(undefined, Language.French)).toBeUndefined()
    expect(getTranslatedDescription({}, Language.French)).toBeUndefined()
    expect(getTranslatedDescription(translations, Language.English)).toBeUndefined()
  })

  it('matches the exact locale tag', () => {
    expect(getTranslatedDescription(translations, Language.French)).toBe('Description en français.')
    expect(getTranslatedDescription(translations, Language.ChineseSimplified)).toBe('简体中文描述。')
    expect(getTranslatedDescription(translations, Language.ChineseTraditional)).toBe('繁體中文描述。')
  })

  it('matches keys case-insensitively', () => {
    expect(getTranslatedDescription({ 'FR-fr': 'Bonjour' }, Language.French)).toBe('Bonjour')
  })

  it('falls back to the bare language subtag key', () => {
    expect(getTranslatedDescription(translations, Language.Vietnamese)).toBe('Mô tả tiếng Việt.')
  })

  it('falls back to a regional variant sharing the language subtag', () => {
    expect(getTranslatedDescription(translations, Language.SpanishLatam)).toBe('Descripción en español.')
    expect(getTranslatedDescription(translations, Language.SpanishUnitedStates)).toBe('Descripción en español.')
  })

  it('returns undefined when no key shares the language subtag', () => {
    expect(getTranslatedDescription(translations, Language.Japanese)).toBeUndefined()
  })

  it('treats an empty translation string as missing', () => {
    expect(getTranslatedDescription({ 'ja-JP': '' }, Language.Japanese)).toBeUndefined()
  })
})
