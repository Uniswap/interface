export const SUPPORTED_LOCALES = [
  'en',
  'pseudo-en',
  'de',
  'es-AR',
  'es-US',
  'it-IT',
  'iw',
  'ro',
  'ru',
  'vi',
  'zh-CN',
  'zh-TW',
] as const
export type SupportedLocale = typeof SUPPORTED_LOCALES[number]

export const DEFAULT_LOCALE: SupportedLocale = 'en'

export const LOCALE_LABEL: { [locale in SupportedLocale]: string } = {
  en: 'English',
  de: 'Deutsch',
  'es-AR': 'español (Argentina)',
  'es-US': 'español (Estados Unidos)',
  'it-IT': 'italiano',
  iw: 'Hebrew',
  ro: 'română',
  ru: 'русский',
  vi: 'Tiếng Việt',
  'zh-CN': '中文 ( 中国 )',
  'zh-TW': '中文 ( 台灣 )',
  'pseudo-en': '',
}
