import useParsedQueryString from 'hooks/useParsedQueryString'
import { dynamicActivate, getDetectedLocale, isSupportedLocale } from 'i18n'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { AppDispatch } from '../index'
import { updateMatchesDarkMode } from './actions'
import { useLocale } from './hooks'

export default function Updater(): null {
  const dispatch = useDispatch<AppDispatch>()
  const parsed = useParsedQueryString()

  const locale = useLocale()

  // keep dark mode in sync with the system
  useEffect(() => {
    const darkHandler = (match: MediaQueryListEvent) => {
      dispatch(updateMatchesDarkMode({ matchesDarkMode: match.matches }))
    }

    const match = window?.matchMedia('(prefers-color-scheme: dark)')
    dispatch(updateMatchesDarkMode({ matchesDarkMode: match.matches }))

    if (match?.addListener) {
      match?.addListener(darkHandler)
    } else if (match?.addEventListener) {
      match?.addEventListener('change', darkHandler)
    }

    return () => {
      if (match?.removeListener) {
        match?.removeListener(darkHandler)
      } else if (match?.removeEventListener) {
        match?.removeEventListener('change', darkHandler)
      }
    }
  }, [dispatch])

  useEffect(() => {
    if (typeof parsed.lng === 'string' && isSupportedLocale(parsed.lng)) {
      // always respect lgn query param
      dynamicActivate(parsed.lng)
    } else if (locale) {
      dynamicActivate(locale)
    } else {
      const detectedLocale = getDetectedLocale()
      if (detectedLocale) dynamicActivate(detectedLocale)
    }
  }, [dispatch, locale, parsed])

  return null
}
