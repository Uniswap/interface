export const SUPPORTED_LOCALES = [
  // order as they appear in the language dropdown
  'en-US',
]
export type SupportedLocale = typeof SUPPORTED_LOCALES[number] | 'pseudo'

export const DEFAULT_LOCALE: SupportedLocale = 'en-US'

export const LOCALE_LABEL: { [locale in SupportedLocale]: string } = {
  'af-ZA': 'Afrikaans',
  'ar-SA': 'العربية',
  'ca-ES': 'Català',
  'cs-CZ': 'čeština',
  'da-DK': 'dansk',
  'de-DE': 'Deutsch',
  'el-GR': 'ελληνικά',
  'en-US': 'English',
  'es-ES': 'Español',
  'fi-FI': 'suomi',
  'fr-FR': 'français',
  'he-IL': 'עִברִית',
  'hu-HU': 'Magyar',
  'id-ID': 'bahasa Indonesia',
  'it-IT': 'Italiano',
  'ja-JP': '日本語',
  'ko-KR': '한국어',
  'nl-NL': 'Nederlands',
  'no-NO': 'norsk',
  'pl-PL': 'Polskie',
  'pt-BR': 'português',
  'pt-PT': 'português',
  'ro-RO': 'Română',
  'ru-RU': 'русский',
  'sr-SP': 'Српски',
  'sv-SE': 'svenska',
  'sw-TZ': 'Kiswahili',
  'tr-TR': 'Türkçe',
  'uk-UA': 'Український',
  'vi-VN': 'Tiếng Việt',
  'zh-CN': '简体中文',
  'zh-TW': '繁体中文',
  pseudo: 'ƥƨèúδô',
}
