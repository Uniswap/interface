import { useEffect } from 'react'
import { useAppDispatch } from 'state/hooks'

import { updateMatchesDarkMode } from './actions'

export default function Updater(): null {
  const dispatch = useAppDispatch()

  // keep dark mode in sync with the system
  useEffect(() => {
    const darkHandler = (_: MediaQueryListEvent) => {
      dispatch(updateMatchesDarkMode({ matchesDarkMode: true }))
    }

    const match = window?.matchMedia('(prefers-color-scheme: dark)')
    dispatch(updateMatchesDarkMode({ matchesDarkMode: true }))

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

  return null
}
