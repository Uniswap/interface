import 'i18next'
// This is only required because importing json as const is not yet supported
// The json file can be directly imported instead of generating an interface when that is available
import Resources from 'wallet/src/i18n/locales/@types/resources'

interface CustomResources {
  translation: Resources['en-US']
}

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: CustomResources
  }
}
