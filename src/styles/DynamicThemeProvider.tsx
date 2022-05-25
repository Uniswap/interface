import { ThemeProvider } from '@shopify/restyle'
import React, { PropsWithChildren, useMemo } from 'react'
import { useColorScheme } from 'react-native'
import { useAppSelector } from 'src/app/hooks'
import { useAddressColor } from 'src/components/accounts/Identicon'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { selectUserPalette } from 'src/features/wallet/selectors'
import { darkTheme, theme as lightTheme, Theme } from './theme'

/** Provides app theme based on active account */
export function DynamicThemeProvider({ children }: PropsWithChildren<{}>) {
  const isDarkMode = useColorScheme() === 'dark'
  const activeAccount = useActiveAccount()

  const userPalette = useAppSelector(selectUserPalette)

  const primaryColor = useAddressColor(activeAccount?.address ?? '', isDarkMode)
  const secondaryColor = useAddressColor(activeAccount?.address ?? '', isDarkMode, /*offset=*/ 2)

  const baseTheme = isDarkMode ? darkTheme : lightTheme

  const theme: Theme = useMemo(
    () => ({
      ...baseTheme,
      colors: {
        ...baseTheme.colors,
        deprecated_primary1: userPalette?.deprecated_primary1 ?? primaryColor,
        deprecated_secondary1: userPalette?.deprecated_secondary1 ?? secondaryColor,
        ...(userPalette?.deprecated_background1
          ? {
              deprecated_background1: userPalette.deprecated_background1,
            }
          : {}),
      },
    }),
    [
      baseTheme,
      primaryColor,
      secondaryColor,
      userPalette?.deprecated_background1,
      userPalette?.deprecated_primary1,
      userPalette?.deprecated_secondary1,
    ]
  )

  return <ThemeProvider theme={theme}>{children}</ThemeProvider>
}
