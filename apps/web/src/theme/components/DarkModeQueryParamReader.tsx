import { parse } from 'qs'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useLocation } from 'react-router'
import { AppearanceSettingType, setSelectedAppearanceSettings } from 'uniswap/src/features/appearance/slice'

export default function DarkModeQueryParamReader(): null {
  const { search } = useLocation()
  const dispatch = useDispatch()

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
      dispatch(setSelectedAppearanceSettings(AppearanceSettingType.Light))
    } else if (theme.toLowerCase() === 'dark') {
      dispatch(setSelectedAppearanceSettings(AppearanceSettingType.Dark))
    }
  }, [search, dispatch])

  return null
}
