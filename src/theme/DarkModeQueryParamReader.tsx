import { parse } from 'qs'
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAppDispatch } from 'state/hooks'

import { updateUserDarkMode } from '../state/user/reducer'

export default function DarkModeQueryParamReader(): null {
  const { search } = useLocation()
  const dispatch = useAppDispatch()

  useEffect(() => {
    if (!search) return
    if (search.length < 2) return

    const parsed = parse(search, {
      parseArrays: false,
      ignoreQueryPrefix: true,
    })

    const theme = parsed.theme

    if (typeof theme !== 'string') return

    if (theme.toLowerCase() === 'light') {
      dispatch(updateUserDarkMode({ userDarkMode: false }))
    } else if (theme.toLowerCase() === 'dark') {
      dispatch(updateUserDarkMode({ userDarkMode: true }))
    }
  }, [dispatch, search])

  return null
}
