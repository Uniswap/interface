import { parse } from 'qs'
import { useEffect } from 'react'
import { useLocation } from 'react-router'
import { ThemeMode, useDarkModeManager } from 'theme/components/ThemeToggle'

export default function DarkModeQueryParamReader(): null {
  const { search } = useLocation()
  const [, updateMode] = useDarkModeManager()

  useEffect(() => {
    if (!search) {
      return
    }
    if (search.length < 2) {
      return
    }

    const parsed = parse(search, {
      parseArrays: false,
      ignoreQueryPrefix: true,
    })

    const theme = parsed.theme

    if (typeof theme !== 'string') {
      return
    }

    if (theme.toLowerCase() === 'light') {
      updateMode(ThemeMode.LIGHT)
    } else if (theme.toLowerCase() === 'dark') {
      updateMode(ThemeMode.DARK)
    }
  }, [search, updateMode])

  return null
}
