/* eslint-disable @typescript-eslint/no-unused-expressions */
/**
 * Dynamically import the locale data for the given language code. Polyfills
 * affect the app startup time, so we need to load them selectively.
 */
// eslint-disable-next-line complexity
export function loadLocaleData(langCode) {
  const baseCode = langCode.split('-')[0]
  switch (baseCode) {
    case 'zh':
      require('@formatjs/intl-pluralrules/locale-data/zh').default
      switch (langCode) {
        case 'zh-Hans':
          require('@formatjs/intl-numberformat/locale-data/zh-Hans').default
          require('@formatjs/intl-datetimeformat/locale-data/zh-Hans').default
          require('@formatjs/intl-relativetimeformat/locale-data/zh-Hans').default
          break
        case 'zh-Hant':
          require('@formatjs/intl-numberformat/locale-data/zh-Hant').default
          require('@formatjs/intl-datetimeformat/locale-data/zh-Hant').default
          require('@formatjs/intl-relativetimeformat/locale-data/zh-Hant').default
          break
        default:
          require('@formatjs/intl-numberformat/locale-data/zh').default
          require('@formatjs/intl-datetimeformat/locale-data/zh').default
          require('@formatjs/intl-relativetimeformat/locale-data/zh').default
          break
      }
      break
    case 'nl':
      require('@formatjs/intl-pluralrules/locale-data/nl').default
      require('@formatjs/intl-numberformat/locale-data/nl').default
      require('@formatjs/intl-datetimeformat/locale-data/nl').default
      require('@formatjs/intl-relativetimeformat/locale-data/nl').default
      break
    case 'en':
      require('@formatjs/intl-pluralrules/locale-data/en').default
      require('@formatjs/intl-numberformat/locale-data/en').default
      require('@formatjs/intl-datetimeformat/locale-data/en').default
      require('@formatjs/intl-relativetimeformat/locale-data/en').default
      break
    case 'es':
      require('@formatjs/intl-pluralrules/locale-data/es').default
      switch (langCode) {
        // Spanish locales that use `,` as the decimal separator
        case 'es-419':
          require('@formatjs/intl-numberformat/locale-data/es-419').default
          require('@formatjs/intl-datetimeformat/locale-data/es-419').default
          require('@formatjs/intl-relativetimeformat/locale-data/es-419').default
          break
        case 'es-BZ':
          require('@formatjs/intl-numberformat/locale-data/es-BZ').default
          require('@formatjs/intl-datetimeformat/locale-data/es-BZ').default
          require('@formatjs/intl-relativetimeformat/locale-data/es-BZ').default
          break
        case 'es-CU':
          require('@formatjs/intl-numberformat/locale-data/es-CU').default
          require('@formatjs/intl-datetimeformat/locale-data/es-CU').default
          require('@formatjs/intl-relativetimeformat/locale-data/es-CU').default
          break
        case 'es-DO':
          require('@formatjs/intl-numberformat/locale-data/es-DO').default
          require('@formatjs/intl-datetimeformat/locale-data/es-DO').default
          require('@formatjs/intl-relativetimeformat/locale-data/es-DO').default
          break
        case 'es-GT':
          require('@formatjs/intl-numberformat/locale-data/es-GT').default
          require('@formatjs/intl-datetimeformat/locale-data/es-GT').default
          require('@formatjs/intl-relativetimeformat/locale-data/es-GT').default
          break
        case 'es-HN':
          require('@formatjs/intl-numberformat/locale-data/es-HN').default
          require('@formatjs/intl-datetimeformat/locale-data/es-HN').default
          require('@formatjs/intl-relativetimeformat/locale-data/es-HN').default
          break
        case 'es-MX':
          require('@formatjs/intl-numberformat/locale-data/es-MX').default
          require('@formatjs/intl-datetimeformat/locale-data/es-MX').default
          require('@formatjs/intl-relativetimeformat/locale-data/es-MX').default
          break
        case 'es-NI':
          require('@formatjs/intl-numberformat/locale-data/es-NI').default
          require('@formatjs/intl-datetimeformat/locale-data/es-NI').default
          require('@formatjs/intl-relativetimeformat/locale-data/es-NI').default
          break
        case 'es-PA':
          require('@formatjs/intl-numberformat/locale-data/es-PA').default
          require('@formatjs/intl-datetimeformat/locale-data/es-PA').default
          require('@formatjs/intl-relativetimeformat/locale-data/es-PA').default
          break
        case 'es-PE':
          require('@formatjs/intl-numberformat/locale-data/es-PE').default
          require('@formatjs/intl-datetimeformat/locale-data/es-PE').default
          require('@formatjs/intl-relativetimeformat/locale-data/es-PE').default
          break
        case 'es-PR':
          require('@formatjs/intl-numberformat/locale-data/es-PR').default
          require('@formatjs/intl-datetimeformat/locale-data/es-PR').default
          require('@formatjs/intl-relativetimeformat/locale-data/es-PR').default
          break
        case 'es-SV':
          require('@formatjs/intl-numberformat/locale-data/es-SV').default
          require('@formatjs/intl-datetimeformat/locale-data/es-SV').default
          require('@formatjs/intl-relativetimeformat/locale-data/es-SV').default
          break
        case 'es-US':
          require('@formatjs/intl-numberformat/locale-data/es-US').default
          require('@formatjs/intl-datetimeformat/locale-data/es-US').default
          require('@formatjs/intl-relativetimeformat/locale-data/es-US').default
          break
        // Spanish locales that use `.` as the decimal separator
        case 'es-AR':
          require('@formatjs/intl-numberformat/locale-data/es-AR').default
          require('@formatjs/intl-datetimeformat/locale-data/es-AR').default
          require('@formatjs/intl-relativetimeformat/locale-data/es-AR').default
          break
        case 'es-BO':
          require('@formatjs/intl-numberformat/locale-data/es-BO').default
          require('@formatjs/intl-datetimeformat/locale-data/es-BO').default
          require('@formatjs/intl-relativetimeformat/locale-data/es-BO').default
          break
        case 'es-CL':
          require('@formatjs/intl-numberformat/locale-data/es-CL').default
          require('@formatjs/intl-datetimeformat/locale-data/es-CL').default
          require('@formatjs/intl-relativetimeformat/locale-data/es-CL').default
          break
        case 'es-CO':
          require('@formatjs/intl-numberformat/locale-data/es-CO').default
          require('@formatjs/intl-datetimeformat/locale-data/es-CO').default
          require('@formatjs/intl-relativetimeformat/locale-data/es-CO').default
          break
        case 'es-CR':
          require('@formatjs/intl-numberformat/locale-data/es-CR').default
          require('@formatjs/intl-datetimeformat/locale-data/es-CR').default
          require('@formatjs/intl-relativetimeformat/locale-data/es-CR').default
          break
        case 'es-EC':
          require('@formatjs/intl-numberformat/locale-data/es-EC').default
          require('@formatjs/intl-datetimeformat/locale-data/es-EC').default
          require('@formatjs/intl-relativetimeformat/locale-data/es-EC').default
          break
        case 'es-PY':
          require('@formatjs/intl-numberformat/locale-data/es-PY').default
          require('@formatjs/intl-datetimeformat/locale-data/es-PY').default
          require('@formatjs/intl-relativetimeformat/locale-data/es-PY').default
          break
        case 'es-UY':
          require('@formatjs/intl-numberformat/locale-data/es-UY').default
          require('@formatjs/intl-datetimeformat/locale-data/es-UY').default
          require('@formatjs/intl-relativetimeformat/locale-data/es-UY').default
          break
        case 'es-VE':
          require('@formatjs/intl-numberformat/locale-data/es-VE').default
          require('@formatjs/intl-datetimeformat/locale-data/es-VE').default
          require('@formatjs/intl-relativetimeformat/locale-data/es-VE').default
          break
        default:
          require('@formatjs/intl-numberformat/locale-data/es').default
          require('@formatjs/intl-datetimeformat/locale-data/es').default
          require('@formatjs/intl-relativetimeformat/locale-data/es').default
          break
      }
      break
    case 'fr':
      require('@formatjs/intl-pluralrules/locale-data/fr').default
      require('@formatjs/intl-numberformat/locale-data/fr').default
      require('@formatjs/intl-datetimeformat/locale-data/fr').default
      require('@formatjs/intl-relativetimeformat/locale-data/fr').default
      break
    case 'hi':
      require('@formatjs/intl-pluralrules/locale-data/hi').default
      require('@formatjs/intl-numberformat/locale-data/hi').default
      require('@formatjs/intl-datetimeformat/locale-data/hi').default
      require('@formatjs/intl-relativetimeformat/locale-data/hi').default
      break
    case 'id':
      require('@formatjs/intl-pluralrules/locale-data/id').default
      require('@formatjs/intl-numberformat/locale-data/id').default
      require('@formatjs/intl-datetimeformat/locale-data/id').default
      require('@formatjs/intl-relativetimeformat/locale-data/id').default
      break
    case 'ja':
      require('@formatjs/intl-pluralrules/locale-data/ja').default
      require('@formatjs/intl-numberformat/locale-data/ja').default
      require('@formatjs/intl-datetimeformat/locale-data/ja').default
      require('@formatjs/intl-relativetimeformat/locale-data/ja').default
      break
    case 'ms':
      require('@formatjs/intl-pluralrules/locale-data/ms').default
      require('@formatjs/intl-numberformat/locale-data/ms').default
      require('@formatjs/intl-datetimeformat/locale-data/ms').default
      require('@formatjs/intl-relativetimeformat/locale-data/ms').default
      break
    case 'pt':
      require('@formatjs/intl-pluralrules/locale-data/pt').default
      require('@formatjs/intl-numberformat/locale-data/pt').default
      require('@formatjs/intl-datetimeformat/locale-data/pt').default
      require('@formatjs/intl-relativetimeformat/locale-data/pt').default
      break
    case 'ru':
      require('@formatjs/intl-pluralrules/locale-data/ru').default
      require('@formatjs/intl-numberformat/locale-data/ru').default
      require('@formatjs/intl-datetimeformat/locale-data/ru').default
      require('@formatjs/intl-relativetimeformat/locale-data/ru').default
      break
    case 'th':
      require('@formatjs/intl-pluralrules/locale-data/th').default
      require('@formatjs/intl-numberformat/locale-data/th').default
      require('@formatjs/intl-datetimeformat/locale-data/th').default
      require('@formatjs/intl-relativetimeformat/locale-data/th').default
      break
    case 'tr':
      require('@formatjs/intl-pluralrules/locale-data/tr').default
      require('@formatjs/intl-numberformat/locale-data/tr').default
      require('@formatjs/intl-datetimeformat/locale-data/tr').default
      require('@formatjs/intl-relativetimeformat/locale-data/tr').default
      break
    case 'uk':
      require('@formatjs/intl-pluralrules/locale-data/uk').default
      require('@formatjs/intl-numberformat/locale-data/uk').default
      require('@formatjs/intl-datetimeformat/locale-data/uk').default
      require('@formatjs/intl-relativetimeformat/locale-data/uk').default
      break
    case 'ur':
      require('@formatjs/intl-pluralrules/locale-data/ur').default
      require('@formatjs/intl-numberformat/locale-data/ur').default
      require('@formatjs/intl-datetimeformat/locale-data/ur').default
      require('@formatjs/intl-relativetimeformat/locale-data/ur').default
      break
    case 'vi':
      require('@formatjs/intl-pluralrules/locale-data/vi').default
      require('@formatjs/intl-numberformat/locale-data/vi').default
      require('@formatjs/intl-datetimeformat/locale-data/vi').default
      require('@formatjs/intl-relativetimeformat/locale-data/vi').default
      break
    default:
      break
  }

  // Needed to processing the swap inputs which uses en locale for number formatting
  require('@formatjs/intl-numberformat/locale-data/en').default
}
