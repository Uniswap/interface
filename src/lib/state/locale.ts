import { DEFAULT_LOCALE, SupportedLocale } from 'constants/locales'
import { atom } from 'jotai'

export const localeAtom = atom<SupportedLocale>(DEFAULT_LOCALE)
