import 'react-i18next'
import enUS from './i18n/locales/en-US.json'

const resources = {
  'en-US': {
    translation: enUS,
    // tss
  },
} as const

declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: (typeof resources)['en-US']
  }
}
