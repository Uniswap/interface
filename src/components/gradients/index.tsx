import { ComponentProps, useMemo } from 'react'
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

export function usePrimaryToSecondaryLinearGradient(): Stops {
  const theme = useAppTheme()

  return useMemo(
    () => [
      { offset: '0', stopColor: theme.colors.primary1, stopOpacity: '1' },
      { offset: '1', stopColor: theme.colors.secondary1, stopOpacity: '1' },
    ],
    [theme]
  )
}
