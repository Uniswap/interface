import {
  color,
  ColorProps,
  createRestyleComponent,
  createVariant,
  typography,
  TypographyProps,
  useResponsiveProp,
  VariantProps,
} from '@shopify/restyle'
import React from 'react'
import { useWindowDimensions } from 'react-native'
import { SharedValue, useAnimatedStyle, useDerivedValue } from 'react-native-reanimated'
import { ReText, round } from 'react-native-redash'
import { useAppTheme } from 'src/app/hooks'
import { Box } from 'src/components/layout'
import { Flex } from 'src/components/layout/Flex'
import { DEFAULT_FONT_SCALE } from 'src/components/Text'
import { textVariants } from 'src/styles/font'
import { Theme } from 'src/styles/theme'
import { numberToLocaleStringWorklet } from 'src/utils/reanimated'

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

const ScaledReText = (props: React.ComponentProps<typeof StyledReText>) => {
  const { fontScale } = useWindowDimensions()
  const enableFontScaling = fontScale > DEFAULT_FONT_SCALE

  const variant = useResponsiveProp(props.variant ?? 'bodySmall') as keyof typeof textVariants
  const multiplier = textVariants[variant].maxFontSizeMultiplier

  return (
    <StyledReText
      {...props}
      allowFontScaling={enableFontScaling}
      maxFontSizeMultiplier={multiplier}
    />
  )
}

export const PriceHeader = ({ price, percentChange, date }: HeaderProps) => {
  const theme = useAppTheme()

  const priceFormatted = useDerivedValue(() => {
    // note. block runs inside a worklet, cannot re-use the existing price formatters as-is
    return numberToLocaleStringWorklet(price.value, 'en-US', {
      maximumFractionDigits: 2,
      style: 'currency',
      currency: 'USD',
    })
  })

  const percentChangeFormatted = useDerivedValue(() =>
    isNaN(percentChange.value) ? '-' : `${round(percentChange.value, 2)}%`
  )

  const percentChangeStyles = useAnimatedStyle(() => ({
    color: percentChange.value > 0 ? theme.colors.accentSuccess : theme.colors.accentCritical,
  }))

  const percentChangeIcon = useDerivedValue(() => (percentChange.value > 0 ? '↗' : '↘'))

  return (
    <Box mx="sm">
      <ScaledReText color="textPrimary" text={priceFormatted} variant="headlineLarge" />
      <Flex row gap="xxs">
        <Flex row gap="xxxs">
          <ScaledReText style={percentChangeStyles} text={percentChangeIcon} variant="bodySmall" />
          <ScaledReText
            style={percentChangeStyles}
            text={percentChangeFormatted}
            variant="bodySmall"
          />
        </Flex>
        <ScaledReText color="textSecondary" text={date} variant="bodySmall" />
      </Flex>
    </Box>
  )
}
