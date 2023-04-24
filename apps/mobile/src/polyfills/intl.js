/* eslint-disable @typescript-eslint/no-unused-expressions */
import { Platform } from 'react-native'

// TODO: [MOB-3917] remove polyfill once Hermes support it
// https://github.com/facebook/hermes/issues/23

if (Platform.OS === 'ios') {
  // Polyfills required to use Intl with Hermes engine
  require('@formatjs/intl-getcanonicallocales/polyfill').default

  require('@formatjs/intl-locale/polyfill').default

  require('@formatjs/intl-pluralrules/polyfill').default
  require('@formatjs/intl-pluralrules/locale-data/en').default

  require('@formatjs/intl-numberformat/polyfill').default
  require('@formatjs/intl-numberformat/locale-data/en').default

  require('@formatjs/intl-datetimeformat/polyfill').default
  require('@formatjs/intl-datetimeformat/locale-data/en').default // locale-data for en

  require('@formatjs/intl-relativetimeformat/polyfill').default
  require('@formatjs/intl-relativetimeformat/locale-data/en').default
}
