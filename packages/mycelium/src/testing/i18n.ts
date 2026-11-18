import { createConsoleLogger } from '@universe/logger'
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'

const logger = createConsoleLogger('MyceliumTestI18n')

/**
 * Starts the shared i18next instance with no translations, for tests and stories outside an app, so
 * components render their keys (`common.button.close`) instead of warning that no instance exists.
 */
export function initMyceliumTestI18n(): void {
  if (i18next.isInitialized) {
    return
  }
  // With inline (empty) resources and initImmediate off, init finishes synchronously.
  i18next
    .use(initReactI18next)
    .init({
      lng: 'en-US',
      initImmediate: false,
      resources: {},
      interpolation: { escapeValue: false },
    })
    .catch((error: unknown) => {
      logger.error('failed to start i18next', error)
    })
}
