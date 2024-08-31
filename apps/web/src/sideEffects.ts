// note the reason for the setupi18n function is to avoid webpack tree shaking the file out
// prettier-ignore
import { setupi18n } from 'uniswap/src/i18n/i18n-setup-interface'
// prettier-ignore
import '@reach/dialog/styles.css'
import 'global.css'
// prettier-ignore
import 'polyfills'
// prettier-ignore
import 'tracing'

// adding this so webpack won't tree shake this away, sideEffects was giving trouble
setupi18n()
