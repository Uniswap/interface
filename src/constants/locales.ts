export const SUPPORTED_LOCALES = ['en'] as const
export type SupportedLocale = typeof SUPPORTED_LOCALES[number]

export const DEFAULT_LOCALE: SupportedLocale = 'en'

export const LOCALE_LABEL: { [locale in SupportedLocale]: string } = {
  en: 'English',
}
