import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { RouteComponentProps } from 'react-router-dom'

import { AppDispatch } from 'state'
import { updateUserDarkMode } from 'state/user/actions'
import { queryStringToObject } from 'utils/string'

export default function DarkModeQueryParamReader({ location: { search } }: RouteComponentProps): null {
  const dispatch = useDispatch<AppDispatch>()

  useEffect(() => {
    if (!search) return
    if (search.length < 2) return

    const parsed = queryStringToObject(search)

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
