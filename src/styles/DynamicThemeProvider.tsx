import { ThemeProvider } from '@shopify/restyle'
import React, { PropsWithChildren, useMemo } from 'react'
import { useColorScheme } from 'react-native'
import { useAddressColor } from 'src/components/accounts/Identicon'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { darkTheme, theme as lightTheme, Theme } from './theme'

/** Provides app theme based on active account */
export function DynamicThemeProvider({ children }: PropsWithChildren<{}>) {
  const isDarkMode = useColorScheme() === 'dark'
  const activeAccount = useActiveAccount()

  const primaryColor = useAddressColor(activeAccount?.address ?? '', isDarkMode)
  const secondaryColor = useAddressColor(activeAccount?.address ?? '', isDarkMode, /*offset=*/ 2)

  const baseTheme = isDarkMode ? darkTheme : lightTheme

  const theme: Theme = useMemo(
    () => ({
      ...baseTheme,
      colors: {
        ...baseTheme.colors,
        primary1: primaryColor,
        secondary1: secondaryColor,
      },
    }),
    [baseTheme, primaryColor, secondaryColor]
  )

  return <ThemeProvider theme={theme}>{children}</ThemeProvider>
}
