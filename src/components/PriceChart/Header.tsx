import { createRestyleComponent, createVariant, useTheme, VariantProps } from '@shopify/restyle'
import React from 'react'
import Animated, { interpolate, useAnimatedStyle, useDerivedValue } from 'react-native-reanimated'
import { ReText, round, Vector } from 'react-native-redash'
import { Box } from 'src/components/layout/Box'
import { Theme } from 'src/styles/theme'
import { GraphIndex, GraphMetadata, HEIGHT } from './Model'

interface HeaderProps {
  translation: Vector<Animated.SharedValue<number>>
  index: Animated.SharedValue<GraphIndex>
  graphs: GraphMetadata[]
}

// const StyledReText = createBox<Theme,  & typeof ReText.arguments>(ReText)

const StyledReText = createRestyleComponent<
  VariantProps<Theme, 'textVariants'> & React.ComponentProps<typeof ReText>,
  Theme
>([createVariant({ themeKey: 'textVariants' })], ReText)

export const Header = ({ translation, index, graphs }: HeaderProps) => {
  const theme = useTheme<Theme>()

  const data = useDerivedValue(() => graphs[index.value].data)
  const price = useDerivedValue(() => {
    const p = interpolate(
      translation.y.value,
      [0, HEIGHT],
      [data.value.maxPrice, data.value.minPrice]
    )
    return `$${round(p, 2).toLocaleString('en-US', { currency: 'USD' })}`
  })
  const percentChange = useDerivedValue(() => `${round(data.value.percentChange, 3)}%`)
  const style = useAnimatedStyle(() => ({
    color: data.value.percentChange > 0 ? theme.colors.green : theme.colors.red,
  }))

  return (
    <Box flex={1} padding="md" justifyContent="center">
      <Box flex={1} alignItems="center">
        <StyledReText variant="h1" text={price} />
        <StyledReText variant="h3" style={style} text={percentChange} />
      </Box>
    </Box>
  )
}
