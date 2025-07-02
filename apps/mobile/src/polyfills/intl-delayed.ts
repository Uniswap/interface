import { getWalletDeviceLocale } from 'uniswap/src/i18n/utils'

export function initDynamicIntlPolyfills(): void {
  const locale = getWalletDeviceLocale()
  loadDynamicIntlPolyfills(locale)
}

/**
 * Synchronously load the locale polyfills for the given language code.
 * We need to load them synchronously because the polyfills are needed for other code to run.
 * Polyfills affect the app startup time, so we need to load them selectively.
 */
// eslint-disable-next-line complexity
function loadDynamicIntlPolyfills(locale: string): void {
  const baseCode = locale.split('-')[0]

  // Always load English for swap inputs number formatting
  require('@formatjs/intl-numberformat/locale-data/en')

  switch (baseCode) {
    case 'zh':
      require('@formatjs/intl-pluralrules/locale-data/zh')
      switch (locale) {
        case 'zh-Hans':
          require('@formatjs/intl-numberformat/locale-data/zh-Hans')
          require('@formatjs/intl-datetimeformat/locale-data/zh-Hans')
          require('@formatjs/intl-relativetimeformat/locale-data/zh-Hans')
          break
        case 'zh-Hant':
          require('@formatjs/intl-numberformat/locale-data/zh-Hant')
          require('@formatjs/intl-datetimeformat/locale-data/zh-Hant')
          require('@formatjs/intl-relativetimeformat/locale-data/zh-Hant')
          break
        default:
          require('@formatjs/intl-numberformat/locale-data/zh')
          require('@formatjs/intl-datetimeformat/locale-data/zh')
          require('@formatjs/intl-relativetimeformat/locale-data/zh')
          break
      }
      break

    case 'nl':
      require('@formatjs/intl-pluralrules/locale-data/nl')
      require('@formatjs/intl-numberformat/locale-data/nl')
      require('@formatjs/intl-datetimeformat/locale-data/nl')
      require('@formatjs/intl-relativetimeformat/locale-data/nl')
      break

    case 'es':
      require('@formatjs/intl-pluralrules/locale-data/es')
      switch (locale) {
        case 'es-419':
          require('@formatjs/intl-numberformat/locale-data/es-419')
          require('@formatjs/intl-datetimeformat/locale-data/es-419')
          require('@formatjs/intl-relativetimeformat/locale-data/es-419')
          break
        case 'es-BZ':
          require('@formatjs/intl-numberformat/locale-data/es-BZ')
          require('@formatjs/intl-datetimeformat/locale-data/es-BZ')
          require('@formatjs/intl-relativetimeformat/locale-data/es-BZ')
          break
        case 'es-CU':
          require('@formatjs/intl-numberformat/locale-data/es-CU')
          require('@formatjs/intl-datetimeformat/locale-data/es-CU')
          require('@formatjs/intl-relativetimeformat/locale-data/es-CU')
          break
        case 'es-DO':
          require('@formatjs/intl-numberformat/locale-data/es-DO')
          require('@formatjs/intl-datetimeformat/locale-data/es-DO')
          require('@formatjs/intl-relativetimeformat/locale-data/es-DO')
          break
        case 'es-GT':
          require('@formatjs/intl-numberformat/locale-data/es-GT')
          require('@formatjs/intl-datetimeformat/locale-data/es-GT')
          require('@formatjs/intl-relativetimeformat/locale-data/es-GT')
          break
        case 'es-HN':
          require('@formatjs/intl-numberformat/locale-data/es-HN')
          require('@formatjs/intl-datetimeformat/locale-data/es-HN')
          require('@formatjs/intl-relativetimeformat/locale-data/es-HN')
          break
        case 'es-MX':
          require('@formatjs/intl-numberformat/locale-data/es-MX')
          require('@formatjs/intl-datetimeformat/locale-data/es-MX')
          require('@formatjs/intl-relativetimeformat/locale-data/es-MX')
          break
        case 'es-NI':
          require('@formatjs/intl-numberformat/locale-data/es-NI')
          require('@formatjs/intl-datetimeformat/locale-data/es-NI')
          require('@formatjs/intl-relativetimeformat/locale-data/es-NI')
          break
        case 'es-PA':
          require('@formatjs/intl-numberformat/locale-data/es-PA')
          require('@formatjs/intl-datetimeformat/locale-data/es-PA')
          require('@formatjs/intl-relativetimeformat/locale-data/es-PA')
          break
        case 'es-PE':
          require('@formatjs/intl-numberformat/locale-data/es-PE')
          require('@formatjs/intl-datetimeformat/locale-data/es-PE')
          require('@formatjs/intl-relativetimeformat/locale-data/es-PE')
          break
        case 'es-PR':
          require('@formatjs/intl-numberformat/locale-data/es-PR')
          require('@formatjs/intl-datetimeformat/locale-data/es-PR')
          require('@formatjs/intl-relativetimeformat/locale-data/es-PR')
          break
        case 'es-SV':
          require('@formatjs/intl-numberformat/locale-data/es-SV')
          require('@formatjs/intl-datetimeformat/locale-data/es-SV')
          require('@formatjs/intl-relativetimeformat/locale-data/es-SV')
          break
        case 'es-US':
          require('@formatjs/intl-numberformat/locale-data/es-US')
          require('@formatjs/intl-datetimeformat/locale-data/es-US')
          require('@formatjs/intl-relativetimeformat/locale-data/es-US')
          break
        case 'es-AR':
          require('@formatjs/intl-numberformat/locale-data/es-AR')
          require('@formatjs/intl-datetimeformat/locale-data/es-AR')
          require('@formatjs/intl-relativetimeformat/locale-data/es-AR')
          break
        case 'es-BO':
          require('@formatjs/intl-numberformat/locale-data/es-BO')
          require('@formatjs/intl-datetimeformat/locale-data/es-BO')
          require('@formatjs/intl-relativetimeformat/locale-data/es-BO')
          break
        case 'es-CL':
          require('@formatjs/intl-numberformat/locale-data/es-CL')
          require('@formatjs/intl-datetimeformat/locale-data/es-CL')
          require('@formatjs/intl-relativetimeformat/locale-data/es-CL')
          break
        case 'es-CO':
          require('@formatjs/intl-numberformat/locale-data/es-CO')
          require('@formatjs/intl-datetimeformat/locale-data/es-CO')
          require('@formatjs/intl-relativetimeformat/locale-data/es-CO')
          break
        case 'es-CR':
          require('@formatjs/intl-numberformat/locale-data/es-CR')
          require('@formatjs/intl-datetimeformat/locale-data/es-CR')
          require('@formatjs/intl-relativetimeformat/locale-data/es-CR')
          break
        case 'es-EC':
          require('@formatjs/intl-numberformat/locale-data/es-EC')
          require('@formatjs/intl-datetimeformat/locale-data/es-EC')
          require('@formatjs/intl-relativetimeformat/locale-data/es-EC')
          break
        case 'es-PY':
          require('@formatjs/intl-numberformat/locale-data/es-PY')
          require('@formatjs/intl-datetimeformat/locale-data/es-PY')
          require('@formatjs/intl-relativetimeformat/locale-data/es-PY')
          break
        case 'es-UY':
          require('@formatjs/intl-numberformat/locale-data/es-UY')
          require('@formatjs/intl-datetimeformat/locale-data/es-UY')
          require('@formatjs/intl-relativetimeformat/locale-data/es-UY')
          break
        case 'es-VE':
          require('@formatjs/intl-numberformat/locale-data/es-VE')
          require('@formatjs/intl-datetimeformat/locale-data/es-VE')
          require('@formatjs/intl-relativetimeformat/locale-data/es-VE')
          break
        default:
          require('@formatjs/intl-numberformat/locale-data/es')
          require('@formatjs/intl-datetimeformat/locale-data/es')
          require('@formatjs/intl-relativetimeformat/locale-data/es')
          break
      }
      break

    case 'fr':
      require('@formatjs/intl-pluralrules/locale-data/fr')
      require('@formatjs/intl-numberformat/locale-data/fr')
      require('@formatjs/intl-datetimeformat/locale-data/fr')
      require('@formatjs/intl-relativetimeformat/locale-data/fr')
      break

    case 'hi':
      require('@formatjs/intl-pluralrules/locale-data/hi')
      require('@formatjs/intl-numberformat/locale-data/hi')
      require('@formatjs/intl-datetimeformat/locale-data/hi')
      require('@formatjs/intl-relativetimeformat/locale-data/hi')
      break

    case 'id':
      require('@formatjs/intl-pluralrules/locale-data/id')
      require('@formatjs/intl-numberformat/locale-data/id')
      require('@formatjs/intl-datetimeformat/locale-data/id')
      require('@formatjs/intl-relativetimeformat/locale-data/id')
      break

    case 'ja':
      require('@formatjs/intl-pluralrules/locale-data/ja')
      require('@formatjs/intl-numberformat/locale-data/ja')
      require('@formatjs/intl-datetimeformat/locale-data/ja')
      require('@formatjs/intl-relativetimeformat/locale-data/ja')
      break

    case 'ms':
      require('@formatjs/intl-pluralrules/locale-data/ms')
      require('@formatjs/intl-numberformat/locale-data/ms')
      require('@formatjs/intl-datetimeformat/locale-data/ms')
      require('@formatjs/intl-relativetimeformat/locale-data/ms')
      break

    case 'pt':
      require('@formatjs/intl-pluralrules/locale-data/pt')
      require('@formatjs/intl-numberformat/locale-data/pt')
      require('@formatjs/intl-datetimeformat/locale-data/pt')
      require('@formatjs/intl-relativetimeformat/locale-data/pt')
      break

    case 'ru':
      require('@formatjs/intl-pluralrules/locale-data/ru')
      require('@formatjs/intl-numberformat/locale-data/ru')
      require('@formatjs/intl-datetimeformat/locale-data/ru')
      require('@formatjs/intl-relativetimeformat/locale-data/ru')
      break

    case 'th':
      require('@formatjs/intl-pluralrules/locale-data/th')
      require('@formatjs/intl-numberformat/locale-data/th')
      require('@formatjs/intl-datetimeformat/locale-data/th')
      require('@formatjs/intl-relativetimeformat/locale-data/th')
      break

    case 'tr':
      require('@formatjs/intl-pluralrules/locale-data/tr')
      require('@formatjs/intl-numberformat/locale-data/tr')
      require('@formatjs/intl-datetimeformat/locale-data/tr')
      require('@formatjs/intl-relativetimeformat/locale-data/tr')
      break

    case 'uk':
      require('@formatjs/intl-pluralrules/locale-data/uk')
      require('@formatjs/intl-numberformat/locale-data/uk')
      require('@formatjs/intl-datetimeformat/locale-data/uk')
      require('@formatjs/intl-relativetimeformat/locale-data/uk')
      break

    case 'ur':
      require('@formatjs/intl-pluralrules/locale-data/ur')
      require('@formatjs/intl-numberformat/locale-data/ur')
      require('@formatjs/intl-datetimeformat/locale-data/ur')
      require('@formatjs/intl-relativetimeformat/locale-data/ur')
      break

    case 'vi':
      require('@formatjs/intl-pluralrules/locale-data/vi')
      require('@formatjs/intl-numberformat/locale-data/vi')
      require('@formatjs/intl-datetimeformat/locale-data/vi')
      require('@formatjs/intl-relativetimeformat/locale-data/vi')
      break

    default:
      require('@formatjs/intl-pluralrules/locale-data/en')
      require('@formatjs/intl-datetimeformat/locale-data/en')
      require('@formatjs/intl-relativetimeformat/locale-data/en')
      break
  }
}
