import { getDetectedLocale } from 'i18n'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { AppDispatch } from '../index'
import { updateMatchesDarkMode, updateUserLocale } from './actions'

export default function Updater(): null {
  const dispatch = useDispatch<AppDispatch>()

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

  // keep locale in sync with the system if a locale is detected.
  useEffect(() => {
    const detectedLocale = getDetectedLocale()
    if (detectedLocale) {
      dispatch(updateUserLocale({ userLocale: detectedLocale }))
    }
  }, [dispatch])

  return null
}
