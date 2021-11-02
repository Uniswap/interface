import { createRestyleComponent, createVariant, useTheme, VariantProps } from '@shopify/restyle'
import React from 'react'
import { interpolate, useAnimatedStyle, useDerivedValue } from 'react-native-reanimated'
import { ReText, round } from 'react-native-redash'
import { Box } from 'src/components/layout/Box'
import { HEIGHT } from 'src/components/PriceChart/Model'
import { AnimatedIndex, AnimatedTranslation, GraphMetadatas } from 'src/components/PriceChart/types'
import { Theme } from 'src/styles/theme'

interface HeaderProps {
  translation: AnimatedTranslation
  index: AnimatedIndex
  graphs: GraphMetadatas
}

// const StyledReText = createBox<Theme,  & typeof ReText.arguments>(ReText)

const StyledReText = createRestyleComponent<
  VariantProps<Theme, 'textVariants'> & React.ComponentProps<typeof ReText>,
  Theme
>([createVariant({ themeKey: 'textVariants' })], ReText)

export const Header = ({ translation, index, graphs }: HeaderProps) => {
  const theme = useTheme<Theme>()

  const data = useDerivedValue(() => graphs[index.value].data)

  const price = useDerivedValue(() =>
    interpolate(translation.y.value, [0, HEIGHT], [data.value.maxPrice, data.value.minPrice])
  )
  const percentChange = useDerivedValue(
    () => ((price.value - data.value.startingPrice) / data.value.startingPrice) * 100
  )

  const priceFormatted = useDerivedValue(() => {
    return `$${round(price.value, 2).toLocaleString('en-US', { currency: 'USD' })}`
  })
  const percentChangeFormatted = useDerivedValue(() => `${round(percentChange.value, 3)}%`)

  const style = useAnimatedStyle(() => ({
    color: percentChange.value > 0 ? theme.colors.green : theme.colors.red,
  }))

  return (
    <Box flex={1} padding="md" justifyContent="center">
      <Box flex={1} alignItems="center">
        <StyledReText variant="h1" text={priceFormatted} />
        <StyledReText variant="h3" style={style} text={percentChangeFormatted} />
      </Box>
    </Box>
  )
}
