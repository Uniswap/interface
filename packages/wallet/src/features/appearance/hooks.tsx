import { useMemo, useRef } from 'react'
import { AppState, ColorSchemeName, Platform, useColorScheme } from 'react-native'
import { useAppSelector } from 'wallet/src/state'
import { AppearanceSettingType } from './slice'

export function useCurrentAppearanceSetting(): AppearanceSettingType {
  const { selectedAppearanceSettings } = useAppSelector((state) => state.appearanceSettings)
  return selectedAppearanceSettings
}

export function useSelectedColorScheme(): 'light' | 'dark' {
  const currentAppearanceSetting = useCurrentAppearanceSetting()
  const isDarkMode = useColorSchemeForeground() === 'dark'
  if (currentAppearanceSetting !== AppearanceSettingType.System) {
    return currentAppearanceSetting === AppearanceSettingType.Dark ? 'dark' : 'light'
  }

  const systemTheme = isDarkMode ? 'dark' : 'light'
  return systemTheme
}

// Until React Native supports sync rendering with Fabric, it has a glitch where
// it can flicker the opposite color scheme as it resumes from the background.
// This is caused by the iOS feature where it takes a screenshot of your app
// using both color schemes when its backgrounded so it can show that screenshot
// in the task switcher, etc

// This basically disables that functionality. It means the app screenshot may be
// the wrong color scheme if you change system light/dark while its backgrounded
// but it avoids the flickering that you can see during task switching, which is
// much more common.

// Reference issues:
//   https://github.com/facebook/react-native/issues/35972
//   https://github.com/facebook/react-native/issues/28525
//   https://github.com/expo/expo/issues/10815
const useColorSchemeForeground = (): ColorSchemeName => {
  const colorScheme = useColorScheme()
  const lastCorrectColorScheme = useRef<ColorSchemeName>(colorScheme)
  return useMemo((): ColorSchemeName => {
    const appState = AppState.currentState
    if (Platform.OS === 'ios' && appState.match(/inactive|background/)) {
      return lastCorrectColorScheme.current
    } else {
      lastCorrectColorScheme.current = colorScheme
      return lastCorrectColorScheme.current
    }
  }, [colorScheme])
}
