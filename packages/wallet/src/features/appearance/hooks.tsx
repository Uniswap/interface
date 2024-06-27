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

/**
 * Note commenting this out again, but since we still have some bugs and have
 * tried a few versions of this already, going to leave this in for context.
 *
 * The general problem is that iOS wants to take a screenshot of both light/dark
 * when an app backgrounds so it can use that for showing the placeholder screen
 * in the app switcher properly even if you change from dark/light.
 *
 * React Native has some bugs around this, namely it just doesn't re-render fast
 * enough sometimes and you see a slight flicker as you foreground the app.
 *
 * But unfortunately this fix - which just tries to avoid it by pausing all
 * background scheme changes and accepting that sometimes the task switcher
 * screen may be wrong, also causes a worse issue in that if you do actually
 * change your color scheme while in the background (say you have Auto mode on
 * and it becomes evening) then when you foreground now the app has to do the
 * re-render *as it foregrounds*, which is even worse of a flicker. So, rock and
 * a hard place.
 *
 * For now, disabling: it means we may get some flickers especially on slower
 * devices.
 *
 * If we want less flickering in that case but stronger flickering in the case
 * where the user changes scheme, then we can uncomment this and replace the
 * `useColorScheme` above with `useColorSchemeForeground`.
 */

// ----

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
// const useColorSchemeForeground = (): ColorSchemeName => {
//   const forceUpdate = useForceUpdate()
//   const colorScheme = useColorScheme()
//   const appState = AppState.currentState
//   const lastCorrectColorScheme = useRef<ColorSchemeName>(colorScheme)

//   useEffect(() => {
//     AppState.addEventListener('change', forceUpdate)
//   }, [forceUpdate])

//   return useMemo((): ColorSchemeName => {
//     if (Platform.OS === 'ios' && appState.match(/inactive|background/)) {
//       return lastCorrectColorScheme.current
//     } else {
//       lastCorrectColorScheme.current = colorScheme
//       return lastCorrectColorScheme.current
//     }
//   }, [appState, colorScheme])
// }
