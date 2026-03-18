/* eslint-disable check-file/no-index */

// Web app-specific i18n entry point
// The web app initializes i18n via i18n-setup-web-app.tsx in sideEffects.ts
// This file avoids importing the wallet's i18n-setup which uses extension/mobile APIs

import i18n from 'i18next'

export { changeLanguage } from './changeLanguage'

export default i18n
