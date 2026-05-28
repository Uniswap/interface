// until the web app needs all of tamagui, avoid heavy imports there
// oxlint-disable-next-line no-restricted-imports -- until the web app needs all of tamagui, avoid heavy imports there
import { useThemeName } from '@tamagui/core'

export function useIsDarkMode(): boolean {
  const themeName = useThemeName()
  return themeName.startsWith('dark')
}
