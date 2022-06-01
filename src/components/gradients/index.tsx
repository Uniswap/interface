import React, { ComponentProps, useMemo } from 'react'
import { useColorScheme } from 'react-native'
import { Stop } from 'react-native-svg'
import { useAppTheme } from 'src/app/hooks'
import { RadialGradientBox } from 'src/components/gradients/RadialGradient'
import { dimensions } from 'src/styles/sizing'

type Stops = Array<ComponentProps<typeof Stop>>

export const RainbowLinearGradientStops: Stops = [
  { offset: '0', stopColor: '#FF57EE', stopOpacity: '57%' },
  { offset: '0.1', stopColor: '#FF57EE', stopOpacity: '57%' },
  { offset: '0.4', stopColor: '#FFDAA1', stopOpacity: '100%' },
  { offset: '0.5', stopColor: '#ffffff', stopOpacity: '100%' },
  { offset: '0.7', stopColor: '#78FF86', stopOpacity: '49.01%' },
  { offset: '1', stopColor: '#7A58FF', stopOpacity: '56%' },
]

export function getStops(...colors: string[]): Stops {
  return colors.map((c, i) => ({
    offset: (i * (1 / (colors.length - 1))).toString(),
    stopColor: c,
    stopOpacity: '1',
  }))
}

export function usePrimaryToSecondaryLinearGradient(): Stops {
  const theme = useAppTheme()

  return useMemo(
    () => getStops(theme.colors.deprecated_primary1, theme.colors.deprecated_gray600),
    [theme]
  )
}

export function usePinkToBlueLinearGradient(): Stops {
  const theme = useAppTheme()

  return useMemo(
    () => getStops(theme.colors.deprecated_pink, theme.colors.deprecated_background1),
    [theme.colors.deprecated_background1, theme.colors.deprecated_pink]
  )
}

export function AppBackground() {
  const theme = useAppTheme()
  const darkMode = useColorScheme() === 'dark'

  return (
    <RadialGradientBox
      height={dimensions.fullHeight}
      opacity={darkMode ? 0.4 : 0.2}
      stops={getStops(
        theme.colors.deprecated_primary1,
        theme.colors.mainBackground,
        theme.colors.mainBackground
      )}
      width={dimensions.fullWidth}
    />
  )
}
