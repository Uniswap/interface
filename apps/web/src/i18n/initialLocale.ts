import { DEFAULT_LOCALE } from 'constants/locales'
import { navigatorLocale, parseLocale, storeLocale } from 'hooks/useActiveLocale'
import { parsedQueryString } from 'hooks/useParsedQueryString'

export const initialLocale =
  parseLocale(parsedQueryString().lng) ?? storeLocale() ?? navigatorLocale() ?? DEFAULT_LOCALE
