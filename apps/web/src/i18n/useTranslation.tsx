import i18n, { t } from 'i18next'
import { useTranslation as useTranslationOG } from 'react-i18next'
import { isTestEnv } from 'utilities/src/environment'

export function useTranslation() {
  if (isTestEnv()) {
    return { i18n, t }
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useTranslationOG()
}
