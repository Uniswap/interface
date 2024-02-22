import { useColorScheme } from 'react-native'
import { useAppSelector } from 'wallet/src/state'
import { AppearanceSettingType } from './slice'

export function useCurrentAppearanceSetting(): AppearanceSettingType {
  const { selectedAppearanceSettings } = useAppSelector((state) => state.appearanceSettings)
  return selectedAppearanceSettings
}

export function useSelectedColorScheme(): 'light' | 'dark' {
  const currentAppearanceSetting = useCurrentAppearanceSetting()
  const isDarkMode = useColorScheme() === 'dark'
  if (currentAppearanceSetting !== AppearanceSettingType.System) {
    return currentAppearanceSetting === AppearanceSettingType.Dark ? 'dark' : 'light'
  }

  const systemTheme = isDarkMode ? 'dark' : 'light'
  return systemTheme
}
