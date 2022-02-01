import React from 'react'
import { interpolateColor, useAnimatedStyle } from 'react-native-reanimated'
import { useAppTheme } from 'src/app/hooks'
import { AnimatedNumber } from 'src/components/PriceChart/types'
import { AnimatedText } from 'src/components/Text'

interface Props {
  label: string
  index: number
  selectedIndex: AnimatedNumber
  transition: AnimatedNumber
}

export function TimeRangeLabel({ index, label, selectedIndex, transition }: Props) {
  const theme = useAppTheme()

  const style = useAnimatedStyle(() => {
    const selected = index === selectedIndex.value

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
