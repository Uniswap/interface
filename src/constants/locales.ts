export const SUPPORTED_LOCALES = ['en-US'] as const
export type SupportedLocale = typeof SUPPORTED_LOCALES[number]

export const DEFAULT_LOCALE: SupportedLocale = 'en-US'

export const LOCALE_LABEL: { [locale in SupportedLocale]: string } = {
  'en-US': 'English',
}
