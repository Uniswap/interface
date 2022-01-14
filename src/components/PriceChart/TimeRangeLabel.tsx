import { useTheme } from '@shopify/restyle'
import React from 'react'
import { interpolateColor, useAnimatedStyle } from 'react-native-reanimated'
import { AnimatedNumber } from 'src/components/PriceChart/types'
import { AnimatedText } from 'src/components/Text'
import { Theme } from 'src/styles/theme'

interface Props {
  label: string
  selected: boolean
  transition: AnimatedNumber
}

export function TimeRangeLabel({ label, selected, transition }: Props) {
  const theme = useTheme<Theme>()

  const style = useAnimatedStyle(() => {
    if (!selected) return { color: theme.colors.primary1 }

    const color = interpolateColor(
      transition.value,
      [0, 1],
      [theme.colors.primary1, theme.colors.white]
    )

    return { color }
  })

  return (
    <AnimatedText
      // react-native supports number values https://reactnative.dev/docs/colors#color-ints
      // @ts-expect-error style.color will be an integer
      style={style}
      textAlign="center"
      variant="buttonLabel">
      {label}
    </AnimatedText>
  )
}
