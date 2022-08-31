import {
  color,
  ColorProps,
  createRestyleComponent,
  createVariant,
  typography,
  TypographyProps,
  VariantProps,
} from '@shopify/restyle'
import React from 'react'
import { SharedValue, useAnimatedStyle, useDerivedValue } from 'react-native-reanimated'
import { ReText, round } from 'react-native-redash'
import { useAppTheme } from 'src/app/hooks'
import { Box } from 'src/components/layout'
import { Flex } from 'src/components/layout/Flex'
import { Theme } from 'src/styles/theme'

interface HeaderProps {
  price: SharedValue<number>
  percentChange: SharedValue<number>
  date: SharedValue<string>
}

const StyledReText = createRestyleComponent<
  VariantProps<Theme, 'textVariants'> &
    TypographyProps<Theme> &
    ColorProps<Theme> &
    React.ComponentProps<typeof ReText>,
  Theme
>([createVariant({ themeKey: 'textVariants' }), typography, color], ReText)

export const PriceHeader = ({ price, percentChange, date }: HeaderProps) => {
  const theme = useAppTheme()

  const priceFormatted = useDerivedValue(() => {
    // note. block runs inside a worklet, cannot re-use the existing price formatters as-is
    return `$${round(price.value, 2).toLocaleString('en-US', { currency: 'USD' })}`
  })

  const percentChangeFormatted = useDerivedValue(() =>
    isNaN(percentChange.value) ? '-' : `${round(percentChange.value, 2)}%`
  )

  const percentChangeIconStyle = useAnimatedStyle(() => ({
    color: percentChange.value > 0 ? theme.colors.accentSuccess : theme.colors.accentFailure,
  }))

  const percentChangeIcon = useDerivedValue(() => (percentChange.value > 0 ? '↗' : '↘'))

  return (
    <Box mb="lg" mx="md">
      <StyledReText
        color="textPrimary"
        fontWeight="300"
        text={priceFormatted}
        variant="headlineLarge"
      />
      <Flex row gap="xxs">
        <Flex row gap="none">
          <StyledReText color="textSecondary" text={percentChangeFormatted} variant="caption" />
          <StyledReText style={percentChangeIconStyle} text={percentChangeIcon} variant="caption" />
        </Flex>
        <StyledReText color="textSecondary" text={date} variant="caption" />
      </Flex>
    </Box>
  )
}
