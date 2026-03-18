import i18n from 'i18next'
import resourcesToBackend from 'i18next-resources-to-backend'
import { initReactI18next } from 'react-i18next'
import { Locale } from 'uniswap/src/features/language/constants'
import enUsLocale from 'uniswap/src/i18n/locales/source/en-US.json'
import { getLocaleTranslationKey } from 'uniswap/src/i18n/utils'
import { logger } from 'utilities/src/logger/logger'

let isSetup = false

setupi18n()

export function setupi18n(): undefined {
  if (isSetup) {
    return
  }
  isSetup = true

  i18n
    .use(initReactI18next)
    .use(
      resourcesToBackend((locale: string) => {
        // not sure why but it tries to load es THEN es-ES, for any language, but we just want the second
        if (!locale.includes('-')) {
          return undefined
        }

        if (locale === Locale.EnglishUnitedStates) {
          return enUsLocale
        }

        const fileName = getLocaleTranslationKey(locale)

        // eslint-disable-next-line no-unsanitized/method
        return import(`./locales/translations/${fileName}.json`)
      }),
    )
    // eslint-disable-next-line max-params
    .on('failedLoading', (language, namespace, msg) => {
      logger.error(new Error(`Error loading language ${language} ${namespace}: ${msg}`), {
        tags: {
          file: 'i18n',
          function: 'onFailedLoading',
        },
      })
    })

  i18n
    .init({
      react: {
        useSuspense: false,
      },
      returnEmptyString: false,
      keySeparator: false,
      lng: 'en-US',
      fallbackLng: 'en-US',
      interpolation: {
        escapeValue: false, // react already safes from xss
      },
    })
    .catch((err) => {
      logger.error(new Error(`Error initializing i18n ${err}`), {
        tags: {
          file: 'i18n',
          function: 'onFailedInit',
        },
      })
    })

  // add default english translations right away
  i18n.addResourceBundle('en-US', 'translations', {
    'en-US': {
      translation: enUsLocale,
    },
  })

  i18n.changeLanguage('en-US').catch((err) => {
    logger.error(new Error(`${err}`), {
      tags: {
        file: 'i18n',
        function: 'setupi18n',
      },
    })
  })
}
