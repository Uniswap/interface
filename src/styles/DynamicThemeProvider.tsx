import { ThemeProvider } from '@shopify/restyle'
import React, { PropsWithChildren, useMemo } from 'react'
import { useColorScheme } from 'react-native'
import { useAppSelector } from 'src/app/hooks'
import { selectUserPalette } from 'src/features/wallet/selectors'
import { darkTheme, theme as lightTheme, Theme } from './theme'

/** Provides app theme based on active account */
// TODO: add back dynamic theming aspect, probably based on Unicon gradient start / end
export function DynamicThemeProvider({ children }: PropsWithChildren<{}>) {
  const isDarkMode = useColorScheme() === 'dark'

  const userPalette = useAppSelector(selectUserPalette)
  const baseTheme = isDarkMode ? darkTheme : lightTheme

  const theme: Theme = useMemo(
    () => ({
      ...baseTheme,
      colors: {
        ...baseTheme.colors,
        userThemeColor: userPalette?.userThemeColor ?? baseTheme.colors.userThemeColor,
      },
    }),
    [baseTheme, userPalette?.userThemeColor]
  )

  return <ThemeProvider theme={theme}>{children}</ThemeProvider>
}
