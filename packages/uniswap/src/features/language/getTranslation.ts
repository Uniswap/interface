import { Language, mapLanguageToLocale } from 'uniswap/src/features/language/constants'

function languageSubtag(localeKey: string): string {
  return localeKey.split('-')[0]?.toLowerCase() ?? localeKey.toLowerCase()
}

/**
 * Picks the translation for `language` out of a backend `map<string, string>` keyed by locale tag.
 *
 * Per the data-api proto contract (see `Category.name_translations`), keys are BCP-47 tags
 * (`es-ES`, `zh-Hant`, ...), English is the top-level field and never a key, and a missing locale
 * is absent rather than an empty string. Lookup is case-insensitive and degrades gracefully: exact
 * locale, then the bare language subtag (`es`), then any key sharing that subtag so regional
 * variants like es-419 still get the one Spanish translation the backend has. English callers get
 * undefined so they fall back to the untranslated field.
 */
export function getTranslation(
  translations: Record<string, string> | undefined,
  language: Language,
): string | undefined {
  if (!translations || language === Language.English) {
    return undefined
  }

  const locale = mapLanguageToLocale[language].toLowerCase()
  const subtag = languageSubtag(locale)
  const keys = Object.keys(translations)

  const matchedKey =
    keys.find((key) => key.toLowerCase() === locale) ??
    keys.find((key) => key.toLowerCase() === subtag) ??
    keys.find((key) => languageSubtag(key) === subtag)

  return matchedKey && translations[matchedKey] ? translations[matchedKey] : undefined
}
