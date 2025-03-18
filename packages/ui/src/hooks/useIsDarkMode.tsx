// until the web app needs all of tamagui, avoid heavy imports there
// eslint-disable-next-line no-restricted-imports
import { useThemeName } from '@tamagui/core'

export function useIsDarkMode(): boolean {
  const themeName = useThemeName()
  return themeName.startsWith('dark')
}
