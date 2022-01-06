import { createRestyleComponent, createVariant, useTheme, VariantProps } from '@shopify/restyle'
import React from 'react'
import { StyleSheet } from 'react-native'
import { interpolate, useAnimatedStyle, useDerivedValue } from 'react-native-reanimated'
import { ReText, round } from 'react-native-redash'
import { Box } from 'src/components/layout/Box'
import { HEIGHT } from 'src/components/PriceChart/Model'
import {
  AnimatedNumber,
  AnimatedTranslation,
  GraphMetadatas,
} from 'src/components/PriceChart/types'
import { fontFamily } from 'src/styles/font'
import { Theme } from 'src/styles/theme'

interface HeaderProps {
  translation: AnimatedTranslation
  index: AnimatedNumber
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
    translation.y.value === 0
      ? data.value.closePrice
      : interpolate(translation.y.value, [0, HEIGHT], [data.value.highPrice, data.value.lowPrice])
  )
  const percentChange = useDerivedValue(
    () => ((price.value - data.value.openPrice) / data.value.openPrice) * 100
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
        <StyledReText
          style={{ ...styles.homeBalanceLabel, color: theme.colors.mainForeground }}
          text={priceFormatted}
        />
        <StyledReText variant="h3" style={style} text={percentChangeFormatted} />
      </Box>
    </Box>
  )
}

const styles = StyleSheet.create({
  homeBalanceLabel: {
    fontFamily: fontFamily.sansSerif.medium,
    fontSize: 45,
    lineHeight: 45,
  },
})
