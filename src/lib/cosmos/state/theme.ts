import { atom } from 'jotai'
import { useUpdateAtom } from 'jotai/utils'
import { darkTheme, defaultTheme, lightTheme, Theme } from 'lib/theme'
import { useEffect } from 'react'
import { useValue } from 'react-cosmos/fixture'

export const cosmosThemeAtom = atom<Theme | undefined>(undefined)

export function useCosmosTheme() {
  const setCosmosTheme = useUpdateAtom(cosmosThemeAtom)
  const [darkMode] = useValue('dark mode', { defaultValue: false })
  const ctrl = useValue('theme', { defaultValue: { ...defaultTheme, ...lightTheme } })
  const [theme, setTheme] = ctrl
  useEffect(() => {
    setTheme({ ...defaultTheme, ...(darkMode ? darkTheme : lightTheme) })
  }, [darkMode, setTheme])
  useEffect(() => {
    setCosmosTheme(theme)
  }, [setCosmosTheme, theme])
  return ctrl
}
