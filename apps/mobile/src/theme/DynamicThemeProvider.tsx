import { ThemeProvider } from '@shopify/restyle'
import React, { PropsWithChildren, useMemo } from 'react'
import { useColorScheme } from 'react-native'
import { darkTheme, theme as lightTheme, Theme } from 'ui/src/theme/restyle'
import { useCurrentAppearanceSetting } from 'wallet/src/features/appearance/hooks'
import { AppearanceSettingType } from 'wallet/src/features/appearance/slice'

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
