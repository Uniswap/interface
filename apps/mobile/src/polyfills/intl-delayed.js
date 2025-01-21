/* eslint-disable @typescript-eslint/no-unused-expressions */
/**
 * These polyfills are not necessary on initial JS bundle load, so we load them later to make our initial JS bundle smaller and improve app startup time.
 */
// https://www.i18next.com/translation-function/formatting#list
require('@formatjs/intl-listformat/polyfill').default

// https://github.com/formatjs/formatjs/blob/main/packages/intl-listformat/supported-locales.generated.ts
require('@formatjs/intl-listformat/locale-data/zh-Hans').default
require('@formatjs/intl-listformat/locale-data/zh-Hant').default
require('@formatjs/intl-listformat/locale-data/nl').default
require('@formatjs/intl-listformat/locale-data/en').default
require('@formatjs/intl-listformat/locale-data/fr').default
require('@formatjs/intl-listformat/locale-data/hi').default
require('@formatjs/intl-listformat/locale-data/id').default
require('@formatjs/intl-listformat/locale-data/ja').default
require('@formatjs/intl-listformat/locale-data/ms').default
require('@formatjs/intl-listformat/locale-data/pt').default
require('@formatjs/intl-listformat/locale-data/ru').default
require('@formatjs/intl-listformat/locale-data/es').default
require('@formatjs/intl-listformat/locale-data/es-US').default
require('@formatjs/intl-listformat/locale-data/es-419').default
require('@formatjs/intl-listformat/locale-data/th').default
require('@formatjs/intl-listformat/locale-data/tr').default
require('@formatjs/intl-listformat/locale-data/uk').default
require('@formatjs/intl-listformat/locale-data/ur').default
require('@formatjs/intl-listformat/locale-data/vi').default
