import 'i18next'

const en = require('uniswap/src/i18n/locales/source/en-US.json') as Record<string, string>

const resources = {
  translation: en,
} as const

declare module 'i18next' {
  interface CustomTypeOptions {
    resources: typeof resources
  }
}
