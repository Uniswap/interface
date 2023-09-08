import { ThemeProvider } from '@shopify/restyle'
import React, { PropsWithChildren, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Appearance, ColorSchemeName } from 'react-native'
import { darkTheme, theme as lightTheme, Theme } from 'ui/src/theme/restyle'
import { useCurrentAppearanceSetting } from 'wallet/src/features/appearance/hooks'
import { AppearanceSettingType } from 'wallet/src/features/appearance/slice'

const COLOR_SCHEME_FLICKER_DELAY_MS = 250

/** Provides app theme based on active account */
// TODO: [MOB-251] add back dynamic theming aspect, probably based on Unicon gradient start / end
export function DynamicThemeProvider({ children }: PropsWithChildren<unknown>): JSX.Element {
  // we want to actually check system theme here (instead of useIsDarkMode() which gets overridden by always light or always dark mode) because the system color scheme should be the default when the appearance setting is the default value of "system"
  const isSystemDarkMode = useColorScheme() === 'dark'
  const systemTheme = isSystemDarkMode ? darkTheme : lightTheme

  const currentAppearanceSetting = useCurrentAppearanceSetting()
  const selectedTheme =
    currentAppearanceSetting === AppearanceSettingType.Dark ? darkTheme : lightTheme

  const baseTheme =
    currentAppearanceSetting !== AppearanceSettingType.System ? selectedTheme : systemTheme

  const theme: Theme = useMemo(
    () => ({ ...baseTheme, colors: { ...baseTheme.colors } }),
    [baseTheme]
  )

  return <ThemeProvider theme={theme}>{children}</ThemeProvider>
}

/**
 * Custom useColorScheme hook to determine the app's color scheme.
 * Borrowed from https://github.com/facebook/react-native/issues/28525 due to a react-native bug. This workaround debounces the initial color scheme flicker.
 */
function useColorScheme(): ColorSchemeName {
  const [colorScheme, setColorScheme] = useState(Appearance.getColorScheme())
  const timeout = useRef<NodeJS.Timeout>()

  const resetCurrentTimeout = useCallback(() => {
    if (timeout.current) {
      clearTimeout(timeout.current)
    }
  }, [])

  const onColorSchemeChange = useCallback(
    (preferences: Appearance.AppearancePreferences) => {
      resetCurrentTimeout()

      timeout.current = setTimeout(() => {
        setColorScheme(preferences.colorScheme)
      }, COLOR_SCHEME_FLICKER_DELAY_MS)
    },
    [resetCurrentTimeout]
  )

  useEffect(() => {
    Appearance.addChangeListener(onColorSchemeChange)
    return (): void => {
      resetCurrentTimeout()
    }
  }, [onColorSchemeChange, resetCurrentTimeout])

  return colorScheme
}
