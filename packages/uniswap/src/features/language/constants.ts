import { isWebApp } from 'utilities/src/platform'

/**
 * List of supported languages in app, represented by ISO 639 language code.
 * If you add a new locale here, be sure to add polyfills for it in intl.js,
 * resource strings in i18n.ts, and supported localizations in the Uniswap Xcode project.
 */
export enum Language {
  ChineseSimplified = 'zh', // Defaulting overarching Chinese language code to Simplified
  ChineseTraditional = 'zh-Hant',
  Dutch = 'nl',
  English = 'en',
  French = 'fr',
  Indonesian = 'id',
  Japanese = 'ja',
  Korean = 'ko',
  Portuguese = 'pt',
  Russian = 'ru',
  SpanishSpain = 'es',
  SpanishLatam = 'es-419',
  SpanishBelize = 'es-BZ',
  SpanishCuba = 'es-CU',
  SpanishDominicanRepublic = 'es-DO',
  SpanishGuatemala = 'es-GT',
  SpanishHonduras = 'es-HN',
  SpanishMexico = 'es-MX',
  SpanishNicaragua = 'es-NI',
  SpanishPanama = 'es-PA',
  SpanishPeru = 'es-PE',
  SpanishPuertoRico = 'es-PR',
  SpanishElSalvador = 'es-SV',
  SpanishUnitedStates = 'es-US',
  SpanishArgentina = 'es-AR',
  SpanishBolivia = 'es-BO',
  SpanishChile = 'es-CL',
  SpanishColombia = 'es-CO',
  SpanishCostaRica = 'es-CR',
  SpanishEcuador = 'es-EC',
  SpanishParaguay = 'es-PY',
  SpanishUruguay = 'es-UY',
  SpanishVenezuela = 'es-VE',
  Turkish = 'tr',
  Vietnamese = 'vi',
}

export const WALLET_SUPPORTED_LANGUAGES: Language[] = [
  Language.English,
  Language.ChineseSimplified,
  Language.ChineseTraditional,
  Language.French,
  Language.Japanese,
  Language.Portuguese,
  Language.SpanishSpain,
  Language.SpanishLatam,
  Language.SpanishUnitedStates,
  Language.SpanishArgentina,
  Language.SpanishBolivia,
  Language.SpanishChile,
  Language.SpanishColombia,
  Language.SpanishCostaRica,
  Language.SpanishEcuador,
  Language.SpanishParaguay,
  Language.SpanishUruguay,
  Language.SpanishVenezuela,
  Language.SpanishBelize,
  Language.SpanishCuba,
  Language.SpanishDominicanRepublic,
  Language.SpanishGuatemala,
  Language.SpanishHonduras,
  Language.SpanishMexico,
  Language.SpanishNicaragua,
  Language.SpanishPanama,
  Language.SpanishPeru,
  Language.SpanishPuertoRico,
  Language.SpanishElSalvador,
  Language.Vietnamese,
]

// Web's supported Languages
// order as they appear in the language dropdown
export const WEB_SUPPORTED_LANGUAGES: Language[] = [
  Language.English,
  Language.ChineseSimplified,
  Language.ChineseTraditional,
  Language.Dutch,
  Language.French,
  Language.Indonesian,
  Language.Japanese,
  Language.Korean,
  Language.Portuguese,
  Language.Russian,
  Language.SpanishSpain,
  Language.SpanishLatam,
  Language.SpanishUnitedStates,
  Language.SpanishArgentina,
  Language.SpanishBolivia,
  Language.SpanishChile,
  Language.SpanishColombia,
  Language.SpanishCostaRica,
  Language.SpanishEcuador,
  Language.SpanishParaguay,
  Language.SpanishUruguay,
  Language.SpanishVenezuela,
  Language.SpanishBelize,
  Language.SpanishCuba,
  Language.SpanishDominicanRepublic,
  Language.SpanishGuatemala,
  Language.SpanishHonduras,
  Language.SpanishMexico,
  Language.SpanishNicaragua,
  Language.SpanishPanama,
  Language.SpanishPeru,
  Language.SpanishPuertoRico,
  Language.SpanishElSalvador,
  Language.Turkish,
  Language.Vietnamese,
]

export const PLATFORM_SUPPORTED_LANGUAGES = isWebApp ? WEB_SUPPORTED_LANGUAGES : WALLET_SUPPORTED_LANGUAGES

/**
 * External mapping to be used with system locale strings trying to resolve to specific language
 * Included different Spanish variations availabled on Android/iOS as of 11/17/23
 */
export const mapDeviceLanguageToLanguage: Record<string, Language> = {
  'es-BR': Language.SpanishLatam,
  'es-GQ': Language.SpanishLatam, // Equatorial Guinea is an African country but format is closer to LATAM
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
  IndonesianIndonesia = 'id-ID',
  JapaneseJapan = 'ja-JP',
  KoreanKorea = 'ko-KR',
  PortugueseBrazil = 'pt-BR',
  PortuguesePortugal = 'pt-PT',
  RussianRussia = 'ru-RU',
  SpanishLatam = 'es-419',
  SpanishBelize = 'es-BZ',
  SpanishCuba = 'es-CU',
  SpanishDominicanRepublic = 'es-DO',
  SpanishGuatemala = 'es-GT',
  SpanishHonduras = 'es-HN',
  SpanishMexico = 'es-MX',
  SpanishNicaragua = 'es-NI',
  SpanishPanama = 'es-PA',
  SpanishPeru = 'es-PE',
  SpanishPuertoRico = 'es-PR',
  SpanishElSalvador = 'es-SV',
  SpanishUnitedStates = 'es-US',
  SpanishArgentina = 'es-AR',
  SpanishBolivia = 'es-BO',
  SpanishChile = 'es-CL',
  SpanishColombia = 'es-CO',
  SpanishCostaRica = 'es-CR',
  SpanishEcuador = 'es-EC',
  SpanishSpain = 'es-ES',
  SpanishParaguay = 'es-PY',
  SpanishUruguay = 'es-UY',
  SpanishVenezuela = 'es-VE',
  TurkishTurkey = 'tr-TR',
  VietnameseVietnam = 'vi-VN',
}

export const DEFAULT_LOCALE: Locale = Locale.EnglishUnitedStates

/**
 * Internal app mapping between language and locale enums
 * This is needed because we not support all locales and default languages to specific locales
 */
export const mapLanguageToLocale: Record<Language, Locale> = {
  [Language.ChineseSimplified]: Locale.ChineseSimplified,
  [Language.ChineseTraditional]: Locale.ChineseTraditional,
  [Language.Dutch]: Locale.DutchNetherlands,
  [Language.English]: Locale.EnglishUnitedStates,
  [Language.French]: Locale.FrenchFrance,
  [Language.Indonesian]: Locale.IndonesianIndonesia,
  [Language.Japanese]: Locale.JapaneseJapan,
  [Language.Korean]: Locale.KoreanKorea,
  [Language.Portuguese]: Locale.PortuguesePortugal,
  [Language.Russian]: Locale.RussianRussia,
  [Language.SpanishSpain]: Locale.SpanishSpain,
  [Language.SpanishLatam]: Locale.SpanishLatam,
  [Language.SpanishBelize]: Locale.SpanishBelize,
  [Language.SpanishCuba]: Locale.SpanishCuba,
  [Language.SpanishDominicanRepublic]: Locale.SpanishDominicanRepublic,
  [Language.SpanishGuatemala]: Locale.SpanishGuatemala,
  [Language.SpanishHonduras]: Locale.SpanishHonduras,
  [Language.SpanishMexico]: Locale.SpanishMexico,
  [Language.SpanishNicaragua]: Locale.SpanishNicaragua,
  [Language.SpanishPanama]: Locale.SpanishPanama,
  [Language.SpanishPeru]: Locale.SpanishPeru,
  [Language.SpanishPuertoRico]: Locale.SpanishPuertoRico,
  [Language.SpanishElSalvador]: Locale.SpanishElSalvador,
  [Language.SpanishUnitedStates]: Locale.SpanishUnitedStates,
  [Language.SpanishArgentina]: Locale.SpanishArgentina,
  [Language.SpanishBolivia]: Locale.SpanishBolivia,
  [Language.SpanishChile]: Locale.SpanishChile,
  [Language.SpanishColombia]: Locale.SpanishColombia,
  [Language.SpanishCostaRica]: Locale.SpanishCostaRica,
  [Language.SpanishEcuador]: Locale.SpanishEcuador,
  [Language.SpanishParaguay]: Locale.SpanishParaguay,
  [Language.SpanishUruguay]: Locale.SpanishUruguay,
  [Language.SpanishVenezuela]: Locale.SpanishVenezuela,
  [Language.Turkish]: Locale.TurkishTurkey,
  [Language.Vietnamese]: Locale.VietnameseVietnam,
}

/**
 * Internal app mapping between language and locale enums
 * This is needed because we not support all locales and default languages to specific locales
 */
export const mapLocaleToLanguage: Record<Locale, Language> = {
  [Locale.ChineseSimplified]: Language.ChineseSimplified,
  [Locale.ChineseTraditional]: Language.ChineseTraditional,
  [Locale.DutchNetherlands]: Language.Dutch,
  [Locale.EnglishUnitedStates]: Language.English,
  [Locale.FrenchFrance]: Language.French,
  [Locale.IndonesianIndonesia]: Language.Indonesian,
  [Locale.JapaneseJapan]: Language.Japanese,
  [Locale.KoreanKorea]: Language.Korean,
  [Locale.PortugueseBrazil]: Language.Portuguese,
  [Locale.PortuguesePortugal]: Language.Portuguese,
  [Locale.RussianRussia]: Language.Russian,
  [Locale.SpanishSpain]: Language.SpanishSpain,
  [Locale.SpanishLatam]: Language.SpanishLatam,
  [Locale.SpanishBelize]: Language.SpanishBelize,
  [Locale.SpanishCuba]: Language.SpanishCuba,
  [Locale.SpanishDominicanRepublic]: Language.SpanishDominicanRepublic,
  [Locale.SpanishGuatemala]: Language.SpanishGuatemala,
  [Locale.SpanishHonduras]: Language.SpanishHonduras,
  [Locale.SpanishMexico]: Language.SpanishMexico,
  [Locale.SpanishNicaragua]: Language.SpanishNicaragua,
  [Locale.SpanishPanama]: Language.SpanishPanama,
  [Locale.SpanishPeru]: Language.SpanishPeru,
  [Locale.SpanishPuertoRico]: Language.SpanishPuertoRico,
  [Locale.SpanishElSalvador]: Language.SpanishElSalvador,
  [Locale.SpanishUnitedStates]: Language.SpanishUnitedStates,
  [Locale.SpanishArgentina]: Language.SpanishArgentina,
  [Locale.SpanishBolivia]: Language.SpanishBolivia,
  [Locale.SpanishChile]: Language.SpanishChile,
  [Locale.SpanishColombia]: Language.SpanishColombia,
  [Locale.SpanishCostaRica]: Language.SpanishCostaRica,
  [Locale.SpanishEcuador]: Language.SpanishEcuador,
  [Locale.SpanishParaguay]: Language.SpanishParaguay,
  [Locale.SpanishUruguay]: Language.SpanishUruguay,
  [Locale.SpanishVenezuela]: Language.SpanishVenezuela,
  [Locale.TurkishTurkey]: Language.Turkish,
  [Locale.VietnameseVietnam]: Language.Vietnamese,
}

/**
 * List of locale codes supported by the backend notification service.
 * These are simplified locale codes without country/region modifiers (except where specific variants are needed).
 * Use this enum when sending locale information to backend APIs that expect this specific format.
 *
 * Note: The app does not currently support Filipino ('fil'), but it's included here for completeness.
 */
export enum BackendSupportedLocale {
  ChineseSimplified = 'zh-CN',
  ChineseTraditional = 'zh-TW',
  Dutch = 'nl',
  English = 'en',
  Filipino = 'fil',
  French = 'fr',
  Indonesian = 'id',
  Japanese = 'ja',
  Korean = 'ko',
  PortugueseBrazil = 'pt-BR',
  Russian = 'ru',
  SpanishLatam = 'es-419',
  Turkish = 'tr',
  Vietnamese = 'vi',
}

/**
 * Mapping from internal Locale enum values (used for Crowdin integration) to backend-supported locale codes.
 * The backend expects simplified locale codes, while the app uses more specific Crowdin locale formats.
 */
const localeToBackendLocaleMap: Record<Locale, BackendSupportedLocale | undefined> = {
  // Chinese variants
  [Locale.ChineseSimplified]: BackendSupportedLocale.ChineseSimplified,
  [Locale.ChineseTraditional]: BackendSupportedLocale.ChineseTraditional,

  // Dutch
  [Locale.DutchNetherlands]: BackendSupportedLocale.Dutch,

  // English
  [Locale.EnglishUnitedStates]: BackendSupportedLocale.English,

  // French
  [Locale.FrenchFrance]: BackendSupportedLocale.French,

  // Indonesian
  [Locale.IndonesianIndonesia]: BackendSupportedLocale.Indonesian,

  // Japanese
  [Locale.JapaneseJapan]: BackendSupportedLocale.Japanese,

  // Korean
  [Locale.KoreanKorea]: BackendSupportedLocale.Korean,

  // Portuguese - both variants map to pt-BR (Brazil) as it's the LATAM standard
  [Locale.PortugueseBrazil]: BackendSupportedLocale.PortugueseBrazil,
  [Locale.PortuguesePortugal]: BackendSupportedLocale.PortugueseBrazil,

  // Russian
  [Locale.RussianRussia]: BackendSupportedLocale.Russian,

  // All Spanish variants map to es-419 (Latin America standard)
  [Locale.SpanishSpain]: BackendSupportedLocale.SpanishLatam,
  [Locale.SpanishLatam]: BackendSupportedLocale.SpanishLatam,
  [Locale.SpanishBelize]: BackendSupportedLocale.SpanishLatam,
  [Locale.SpanishCuba]: BackendSupportedLocale.SpanishLatam,
  [Locale.SpanishDominicanRepublic]: BackendSupportedLocale.SpanishLatam,
  [Locale.SpanishGuatemala]: BackendSupportedLocale.SpanishLatam,
  [Locale.SpanishHonduras]: BackendSupportedLocale.SpanishLatam,
  [Locale.SpanishMexico]: BackendSupportedLocale.SpanishLatam,
  [Locale.SpanishNicaragua]: BackendSupportedLocale.SpanishLatam,
  [Locale.SpanishPanama]: BackendSupportedLocale.SpanishLatam,
  [Locale.SpanishPeru]: BackendSupportedLocale.SpanishLatam,
  [Locale.SpanishPuertoRico]: BackendSupportedLocale.SpanishLatam,
  [Locale.SpanishElSalvador]: BackendSupportedLocale.SpanishLatam,
  [Locale.SpanishUnitedStates]: BackendSupportedLocale.SpanishLatam,
  [Locale.SpanishArgentina]: BackendSupportedLocale.SpanishLatam,
  [Locale.SpanishBolivia]: BackendSupportedLocale.SpanishLatam,
  [Locale.SpanishChile]: BackendSupportedLocale.SpanishLatam,
  [Locale.SpanishColombia]: BackendSupportedLocale.SpanishLatam,
  [Locale.SpanishCostaRica]: BackendSupportedLocale.SpanishLatam,
  [Locale.SpanishEcuador]: BackendSupportedLocale.SpanishLatam,
  [Locale.SpanishParaguay]: BackendSupportedLocale.SpanishLatam,
  [Locale.SpanishUruguay]: BackendSupportedLocale.SpanishLatam,
  [Locale.SpanishVenezuela]: BackendSupportedLocale.SpanishLatam,

  // Turkish
  [Locale.TurkishTurkey]: BackendSupportedLocale.Turkish,

  // Vietnamese
  [Locale.VietnameseVietnam]: BackendSupportedLocale.Vietnamese,
}

/**
 * Converts internal Locale enum values (used for Crowdin integration) to backend-supported locale codes.
 * The backend expects simplified locale codes, while the app uses more specific Crowdin locale formats.
 *
 * @param locale - The internal Locale enum value
 * @returns The corresponding backend-supported locale code, defaults to English if not found
 */
export function mapLocaleToBackendLocale(locale: Locale): BackendSupportedLocale {
  return localeToBackendLocaleMap[locale] ?? BackendSupportedLocale.English
}
