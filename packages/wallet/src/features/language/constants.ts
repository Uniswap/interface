/**
 * List of supported langauges in app, represented by ISO 639 language code.
 * If you add a new locale here, be sure to add polyfills for it in intl.js,
 * resource strings in i18n.ts, and supported localizations in the Uniswap Xcode project.
 */
export enum Language {
  ChineseSimplified = 'zh', // Defaulting overarching Chinese language code to Simplified
  ChineseTraditional = 'zh-Hant',
  Dutch = 'nl',
  English = 'en',
  French = 'fr',
  Hindi = 'hi',
  Indonesian = 'id',
  Japanese = 'ja',
  Malay = 'ms',
  Portuguese = 'pt',
  Russian = 'ru',
  SpanishSpain = 'es',
  SpanishLatam = 'es-419',
  SpanishUnitedStates = 'es-US',
  Thai = 'th',
  Turkish = 'tr',
  Ukrainian = 'uk',
  Urdu = 'ur',
  Vietnamese = 'vi',
}

/**
 * List of supported locales in app, comprised of two letter language code (ISO 639) combined with two letter country code (ISO 3166).
 * Matches to locale codes for languages provided by Crowdin
 */
export enum Locale {
  ChineseSimplified = 'zh-Hans',
  ChineseTraditional = 'zh-Hant',
  DutchNetherlands = 'nl-NL',
  EnglishUnitedStates = 'en-US',
  FrenchFrance = 'fr-FR',
  HindiIndia = 'hi-IN',
  IndonesianIndonesia = 'id-ID',
  JapaneseJapan = 'ja-JP',
  MalayMalaysia = 'ms-MY',
  PortuguesePortugal = 'pt-PT',
  RussianRussia = 'ru-RU',
  SpanishSpain = 'es-ES',
  SpanishLatam = 'es-419',
  SpanishUnitedStates = 'es-US',
  ThaiThailand = 'th-TH',
  TurkishTurkey = 'tr-TR',
  UkrainianUkraine = 'uk-UA',
  UrduPakistan = 'ur-PK',
  VietnameseVietnam = 'vi-VN',
}

export const SUPPORTED_LANGUAGES: Language[] = [
  Language.English,
  Language.ChineseSimplified,
  Language.ChineseTraditional,
  Language.French,
  Language.Japanese,
  Language.Portuguese,
  Language.SpanishSpain,
  Language.SpanishLatam,
  Language.SpanishUnitedStates,
]

/**
 * Internal app mapping between langauge and locale enums
 * This is needed because we not support all locales and default languages to specific locales
 */
export const mapLanguageToLocale: Record<Language, Locale> = {
  [Language.ChineseSimplified]: Locale.ChineseSimplified,
  [Language.ChineseTraditional]: Locale.ChineseTraditional,
  [Language.Dutch]: Locale.DutchNetherlands,
  [Language.English]: Locale.EnglishUnitedStates,
  [Language.French]: Locale.FrenchFrance,
  [Language.Hindi]: Locale.HindiIndia,
  [Language.Indonesian]: Locale.IndonesianIndonesia,
  [Language.Japanese]: Locale.JapaneseJapan,
  [Language.Malay]: Locale.MalayMalaysia,
  [Language.Portuguese]: Locale.PortuguesePortugal,
  [Language.Russian]: Locale.RussianRussia,
  [Language.SpanishSpain]: Locale.SpanishSpain,
  [Language.SpanishLatam]: Locale.SpanishLatam,
  [Language.SpanishUnitedStates]: Locale.SpanishUnitedStates,
  [Language.Thai]: Locale.ThaiThailand,
  [Language.Turkish]: Locale.TurkishTurkey,
  [Language.Ukrainian]: Locale.UkrainianUkraine,
  [Language.Urdu]: Locale.UrduPakistan,
  [Language.Vietnamese]: Locale.VietnameseVietnam,
}

/**
 * Internal app mapping between langauge and locale enums
 * This is needed because we not support all locales and default languages to specific locales
 */
export const mapLocaleToLanguage: Record<Locale, Language> = {
  [Locale.ChineseSimplified]: Language.ChineseSimplified,
  [Locale.ChineseTraditional]: Language.ChineseTraditional,
  [Locale.DutchNetherlands]: Language.Dutch,
  [Locale.EnglishUnitedStates]: Language.English,
  [Locale.FrenchFrance]: Language.French,
  [Locale.HindiIndia]: Language.Hindi,
  [Locale.IndonesianIndonesia]: Language.Indonesian,
  [Locale.JapaneseJapan]: Language.Japanese,
  [Locale.MalayMalaysia]: Language.Malay,
  [Locale.PortuguesePortugal]: Language.Portuguese,
  [Locale.RussianRussia]: Language.Russian,
  [Locale.SpanishSpain]: Language.SpanishSpain,
  [Locale.SpanishLatam]: Language.SpanishLatam,
  [Locale.SpanishUnitedStates]: Language.SpanishUnitedStates,
  [Locale.ThaiThailand]: Language.Thai,
  [Locale.TurkishTurkey]: Language.Turkish,
  [Locale.UkrainianUkraine]: Language.Ukrainian,
  [Locale.UrduPakistan]: Language.Urdu,
  [Locale.VietnameseVietnam]: Language.Vietnamese,
}
