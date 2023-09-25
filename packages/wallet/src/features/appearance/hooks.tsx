import { useEffect, useState } from 'react'
import {
  AppState,
  ColorSchemeName,
  useColorScheme as useColorSchemeReactNative,
} from 'react-native'
import { useAppSelector } from 'wallet/src/state'
import { AppearanceSettingType } from './slice'

export function useCurrentAppearanceSetting(): AppearanceSettingType {
  const { selectedAppearanceSettings } = useAppSelector((state) => state.appearanceSettings)
  return selectedAppearanceSettings
}

// fixes flashing of wrong color on background of app
// see this for context:
// https://github.com/bluesky-social/social-app/pull/1417
// waiting on this merge from react-native to not need anymore:
// https://github.com/facebook/react-native/pull/39439
function useColorScheme(): ColorSchemeName {
  const colorSchemeFromRN = useColorSchemeReactNative()
  const [nativeColorScheme, setNativeColorScheme] = useState<ColorSchemeName>(colorSchemeFromRN)

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      const isActive = state === 'active'
      if (!isActive) return
      setNativeColorScheme(colorSchemeFromRN)
    })

    return () => {
      subscription.remove()
    }
  }, [colorSchemeFromRN])

  return nativeColorScheme
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

export function useIsDarkMode(): boolean {
  const selectedColorScheme = useSelectedColorScheme()
  return selectedColorScheme === 'dark'
}
