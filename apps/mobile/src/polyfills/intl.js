/* eslint-disable @typescript-eslint/no-unused-expressions */
import { isAndroid } from 'utilities/src/platform'

// TODO: [MOB-247] remove polyfill once Hermes support it
// https://github.com/facebook/hermes/issues/23

// Polyfills required to use Intl with Hermes engine
require('@formatjs/intl-getcanonicallocales/polyfill').default
require('@formatjs/intl-locale/polyfill').default
require('@formatjs/intl-pluralrules/polyfill').default
if (isAndroid) {
  // Forces polyfill to replace Hermes NumberFormat due to issues with "compact" notation
  // https://hermesengine.dev/docs/intl/#android-11
  require('@formatjs/intl-numberformat/polyfill-force').default
} else {
  require('@formatjs/intl-numberformat/polyfill').default
}
require('@formatjs/intl-datetimeformat/polyfill').default
require('@formatjs/intl-relativetimeformat/polyfill').default
