export const supportedLocales = [
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
export type SupportedLocale = typeof supportedLocales[number]

export const defaultFallback = 'en' as SupportedLocale
