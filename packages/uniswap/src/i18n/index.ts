import i18n from 'i18next'

// Mobile and extension use this file directly - import wallet i18n setup
// Web app uses index.web-app.ts via vite alias (which skips this import)
// Using require() instead of import for proper initialization timing in extension webpack build
require('uniswap/src/i18n/i18n-setup')

export { changeLanguage } from './changeLanguage'

export default i18n
