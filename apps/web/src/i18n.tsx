import { dynamicActivate } from 'i18n/dynamicActivate'
import { initialLocale } from 'i18n/initialLocale'
import enUsLocale from 'i18n/locales/source/en-US.json'
import i18n from 'i18next'
import resourcesToBackend from 'i18next-resources-to-backend'
import { initReactI18next } from 'react-i18next'
import { logger } from 'utilities/src/logger/logger'

export { t } from 'i18next'
export { Plural } from './i18n/Plural'
export { Trans } from './i18n/Trans'

i18n
  .use(initReactI18next)
  .use(
    resourcesToBackend((language: string) => {
      // not sure why but it tries to load es THEN es-ES, for any language, but we just want the second
      if (!language.includes('-')) {
        return
      }
      if (language === 'en-US') {
        return enUsLocale
      }
      return import(`./i18n/locales/translations/${language}.json`)
    }),
  )
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
    returnEmptyString: false,
    keySeparator: false,
    lng: 'en-US',
    fallbackLng: 'en-US',
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  })
  .catch(() => undefined)

// add default english ns right away
i18n.addResourceBundle('en-US', 'translations', {
  'en-US': {
    translation: enUsLocale,
  },
})

dynamicActivate(initialLocale)
