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
        case 'es-US':
          require('@formatjs/intl-numberformat/locale-data/es-US').default
          require('@formatjs/intl-datetimeformat/locale-data/es-US').default
          require('@formatjs/intl-relativetimeformat/locale-data/es-US').default
          break
        case 'es-419':
          require('@formatjs/intl-numberformat/locale-data/es-419').default
          require('@formatjs/intl-datetimeformat/locale-data/es-419').default
          require('@formatjs/intl-relativetimeformat/locale-data/es-419').default
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
}
