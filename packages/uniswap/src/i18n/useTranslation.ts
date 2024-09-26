import i18n, { t } from 'i18next'
import { useTranslation as useTranslationOG } from 'react-i18next'
import { isTestEnv } from 'utilities/src/environment/env'

// the types in react-i18next are odd because it returns an array and an object
// so simplifying it to just be an object
type UseTranslationReturn = {
  t: typeof t
  i18n: typeof i18n
  ready: boolean
}

export const useTranslation: () => UseTranslationReturn = isTestEnv()
  ? (): UseTranslationReturn => ({ i18n, t, ready: true })
  : useTranslationOG
