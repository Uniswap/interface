import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { AppDispatch } from '../index'
import { updateMatchesDarkMode, updateVersion } from './actions'

export default function Updater() {
  const dispatch = useDispatch<AppDispatch>()

  useEffect(() => {
    dispatch(updateVersion())
  }, [dispatch])

  // keep dark mode in sync with the system
  useEffect(() => {
    const darkHandler = (match: MediaQueryListEvent) => {
      dispatch(updateMatchesDarkMode({ matchesDarkMode: match.matches }))
    }

    const match = window?.matchMedia('(prefers-color-scheme: dark)')
    dispatch(updateMatchesDarkMode({ matchesDarkMode: match.matches }))

    match?.addEventListener('change', darkHandler)

    return () => {
      match?.removeEventListener('change', darkHandler)
    }
  }, [dispatch])

  return null
}
