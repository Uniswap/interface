import i18n from 'i18next'

// note: not using isInterface here for tree shaking
if (!process.env.REACT_APP_IS_UNISWAP_INTERFACE) {
  require('./i18n-setup')
}

export { t } from 'i18next'
export { Plural } from './Plural'
export { Trans } from './Trans'
export { changeLanguage } from './changeLanguage'
export { useTranslation } from './useTranslation'

export default i18n
