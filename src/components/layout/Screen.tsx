import { useTheme } from '@shopify/restyle'
import React, { PropsWithChildren, useMemo } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Theme } from 'src/styles/theme'

export function Screen(props: PropsWithChildren<any>) {
  const theme = useTheme<Theme>()

  const container = useMemo(
    () => ({
      flex: 1,
      backgroundColor: theme.colors.mainBackground,
    }),
    [theme]
  )

  return <SafeAreaView style={container}>{props.children}</SafeAreaView>
}
