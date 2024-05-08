/* eslint-disable @typescript-eslint/no-unused-expressions */
import { isAndroid } from 'uniswap/src/utils/platform'

// TODO: [MOB-247] remove polyfill once Hermes support it
// https://github.com/facebook/hermes/issues/23

// Polyfills required to use Intl with Hermes engine
require('@formatjs/intl-getcanonicallocales/polyfill').default

require('@formatjs/intl-locale/polyfill').default

require('@formatjs/intl-pluralrules/polyfill').default

// https://github.com/formatjs/formatjs/blob/main/packages/intl-pluralrules/supported-locales.generated.ts
require('@formatjs/intl-pluralrules/locale-data/zh').default
require('@formatjs/intl-pluralrules/locale-data/nl').default
require('@formatjs/intl-pluralrules/locale-data/en').default
require('@formatjs/intl-pluralrules/locale-data/fr').default
require('@formatjs/intl-pluralrules/locale-data/hi').default
require('@formatjs/intl-pluralrules/locale-data/id').default
require('@formatjs/intl-pluralrules/locale-data/ja').default
require('@formatjs/intl-pluralrules/locale-data/ms').default
require('@formatjs/intl-pluralrules/locale-data/pt').default
require('@formatjs/intl-pluralrules/locale-data/ru').default
require('@formatjs/intl-pluralrules/locale-data/es').default
require('@formatjs/intl-pluralrules/locale-data/th').default
require('@formatjs/intl-pluralrules/locale-data/tr').default
require('@formatjs/intl-pluralrules/locale-data/uk').default
require('@formatjs/intl-pluralrules/locale-data/ur').default
require('@formatjs/intl-pluralrules/locale-data/vi').default

if (isAndroid) {
  // Forces polyfill to replace Hermes NumberFormat due to issues with "compact" notation
  // https://hermesengine.dev/docs/intl/#android-11
  require('@formatjs/intl-numberformat/polyfill-force').default
} else {
  require('@formatjs/intl-numberformat/polyfill').default
}

// https://github.com/formatjs/formatjs/blob/main/packages/intl-numberformat/supported-locales.generated.ts
require('@formatjs/intl-numberformat/locale-data/zh-Hans').default
require('@formatjs/intl-numberformat/locale-data/zh-Hant').default
require('@formatjs/intl-numberformat/locale-data/nl').default
require('@formatjs/intl-numberformat/locale-data/en').default
require('@formatjs/intl-numberformat/locale-data/fr').default
require('@formatjs/intl-numberformat/locale-data/hi').default
require('@formatjs/intl-numberformat/locale-data/id').default
require('@formatjs/intl-numberformat/locale-data/ja').default
require('@formatjs/intl-numberformat/locale-data/ms').default
require('@formatjs/intl-numberformat/locale-data/pt').default
require('@formatjs/intl-numberformat/locale-data/ru').default
require('@formatjs/intl-numberformat/locale-data/es').default
require('@formatjs/intl-numberformat/locale-data/es-US').default
require('@formatjs/intl-numberformat/locale-data/es-419').default
require('@formatjs/intl-numberformat/locale-data/th').default
require('@formatjs/intl-numberformat/locale-data/tr').default
require('@formatjs/intl-numberformat/locale-data/uk').default
require('@formatjs/intl-numberformat/locale-data/ur').default
require('@formatjs/intl-numberformat/locale-data/vi').default

require('@formatjs/intl-datetimeformat/polyfill').default

// https://github.com/formatjs/formatjs/blob/main/packages/intl-datetimeformat/supported-locales.generated.ts
require('@formatjs/intl-datetimeformat/locale-data/zh-Hans').default
require('@formatjs/intl-datetimeformat/locale-data/zh-Hant').default
require('@formatjs/intl-datetimeformat/locale-data/nl').default
require('@formatjs/intl-datetimeformat/locale-data/en').default
require('@formatjs/intl-datetimeformat/locale-data/fr').default
require('@formatjs/intl-datetimeformat/locale-data/hi').default
require('@formatjs/intl-datetimeformat/locale-data/id').default
require('@formatjs/intl-datetimeformat/locale-data/ja').default
require('@formatjs/intl-datetimeformat/locale-data/ms').default
require('@formatjs/intl-datetimeformat/locale-data/pt').default
require('@formatjs/intl-datetimeformat/locale-data/ru').default
require('@formatjs/intl-datetimeformat/locale-data/es').default
require('@formatjs/intl-datetimeformat/locale-data/es-US').default
require('@formatjs/intl-datetimeformat/locale-data/es-419').default
require('@formatjs/intl-datetimeformat/locale-data/th').default
require('@formatjs/intl-datetimeformat/locale-data/tr').default
require('@formatjs/intl-datetimeformat/locale-data/uk').default
require('@formatjs/intl-datetimeformat/locale-data/ur').default
require('@formatjs/intl-datetimeformat/locale-data/vi').default

require('@formatjs/intl-relativetimeformat/polyfill').default

// https://github.com/formatjs/formatjs/blob/main/packages/intl-relativetimeformat/supported-locales.generated.ts
require('@formatjs/intl-relativetimeformat/locale-data/zh-Hans').default
require('@formatjs/intl-relativetimeformat/locale-data/zh-Hant').default
require('@formatjs/intl-relativetimeformat/locale-data/nl').default
require('@formatjs/intl-relativetimeformat/locale-data/en').default
require('@formatjs/intl-relativetimeformat/locale-data/fr').default
require('@formatjs/intl-relativetimeformat/locale-data/hi').default
require('@formatjs/intl-relativetimeformat/locale-data/id').default
require('@formatjs/intl-relativetimeformat/locale-data/ja').default
require('@formatjs/intl-relativetimeformat/locale-data/ms').default
require('@formatjs/intl-relativetimeformat/locale-data/pt').default
require('@formatjs/intl-relativetimeformat/locale-data/ru').default
require('@formatjs/intl-relativetimeformat/locale-data/es').default
require('@formatjs/intl-relativetimeformat/locale-data/es-US').default
require('@formatjs/intl-relativetimeformat/locale-data/es-419').default
require('@formatjs/intl-relativetimeformat/locale-data/th').default
require('@formatjs/intl-relativetimeformat/locale-data/tr').default
require('@formatjs/intl-relativetimeformat/locale-data/uk').default
require('@formatjs/intl-relativetimeformat/locale-data/ur').default
require('@formatjs/intl-relativetimeformat/locale-data/vi').default
