// Mobile and extension use this file directly - import wallet i18n setup
// Web app uses index.web-app.ts via vite alias (which skips this import)
// This import is side-effect-only (it initializes the shared i18next instance), so
// `i18n-setup.tsx` must stay listed in this package's `sideEffects` (package.json) —
// otherwise bundlers that tree-shake by sideEffects (e.g. Vite 8/rolldown) drop it
// entirely and i18n never initializes, which makes react-i18next's useTranslation
// suspend forever and renders a blank app.
import 'uniswap/src/i18n/i18n-setup'
import i18n from 'i18next'

export { changeLanguage } from './changeLanguage'

export default i18n
