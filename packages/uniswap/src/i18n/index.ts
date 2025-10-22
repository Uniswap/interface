import i18n from 'i18next'

// note: not using isWebApp here for tree shaking
if (!process.env.REACT_APP_IS_UNISWAP_INTERFACE) {
  require('./i18n-setup')
}

export { changeLanguage } from './changeLanguage'

export default i18n
