import { ComponentProps, useMemo } from 'react'
import 'react-native-reanimated'
import { Stop } from 'react-native-svg'
import { useAppTheme } from 'src/app/hooks'

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

  return useMemo(() => getStops(theme.colors.accentAction, theme.colors.textSecondary), [theme])
}

export function usePinkToBlueLinearGradient(): Stops {
  const theme = useAppTheme()

  return useMemo(
    () => getStops(theme.colors.accentAction, theme.colors.background1),
    [theme.colors.background1, theme.colors.accentAction]
  )
}
