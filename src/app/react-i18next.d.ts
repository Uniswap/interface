import { resources } from 'src/app/i18n'

// react-i18next versions higher than 11.11.0
declare module 'react-i18next' {
  interface CustomTypeOptions {
    resources: typeof resources['en']
  }
}
