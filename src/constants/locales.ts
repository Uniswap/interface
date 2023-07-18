export const SUPPORTED_LOCALES = [
  // order as they appear in the language dropdown
  'en-US',
  'es-ES',
]
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number] | 'pseudo'

export const DEFAULT_LOCALE: SupportedLocale = 'en-US'

export const LOCALE_LABEL: { [locale in SupportedLocale]: string } = {
  'en-US': 'English',
  'es-ES': 'Español',
  pseudo: 'ƥƨèúδô',
}
