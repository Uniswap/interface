// until the web app needs all of tamagui, avoid heavy imports there
// biome-ignore lint/style/noRestrictedImports: until the web app needs all of tamagui, avoid heavy imports there
import { useThemeName } from '@tamagui/core'

export function useIsDarkMode(): boolean {
  const themeName = useThemeName()
  return themeName.startsWith('dark')
}
