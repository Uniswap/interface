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
import { ReText } from 'react-native-redash'
import { useAppTheme } from 'src/app/hooks'
import { Box } from 'src/components/layout'
import { Flex } from 'src/components/layout/Flex'
import { DEFAULT_FONT_SCALE, Text } from 'src/components/Text'
import { textVariants } from 'src/styles/font'
import { Theme } from 'src/styles/theme'
import { numberToLocaleStringWorklet, numberToPercentWorklet } from 'src/utils/reanimated'

interface HeaderProps {
  price: SharedValue<number>
  percentChange: SharedValue<number>
  date: SharedValue<string>
  loading?: boolean
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

export const PriceHeader = ({ price, percentChange, date, loading }: HeaderProps) => {
  const theme = useAppTheme()

  const priceFormatted = useDerivedValue(() => {
    // note. block runs inside a worklet, cannot re-use the existing price formatters as-is
    return numberToLocaleStringWorklet(price.value, 'en-US', {
      style: 'currency',
      currency: 'USD',
    })
  })

  const percentChangeFormatted = useDerivedValue(() => {
    return numberToPercentWorklet(percentChange.value, { precision: 2, absolute: true })
  })

  const percentChangeStyles = useAnimatedStyle(() => ({
    color: percentChange.value > 0 ? theme.colors.accentSuccess : theme.colors.accentCritical,
  }))

  const percentChangeIcon = useDerivedValue(() => (percentChange.value > 0 ? '↗' : '↘'))

  return (
    <Box mx="sm">
      {loading ? (
        <Text loading loadingPlaceholderText="$10,000" variant="headlineLarge" />
      ) : (
        <ScaledReText color="textPrimary" text={priceFormatted} variant="headlineLarge" />
      )}
      {loading ? (
        <Text loading loadingPlaceholderText="00.00%" variant="bodyLarge" />
      ) : (
        <Flex row gap="xxs">
          <Flex row gap="xxxs">
            <ScaledReText
              style={percentChangeStyles}
              text={percentChangeIcon}
              variant="bodyLarge"
            />
            <ScaledReText
              style={percentChangeStyles}
              text={percentChangeFormatted}
              variant="bodyLarge"
            />
          </Flex>
          <ScaledReText color="textSecondary" text={date} variant="bodyLarge" />
        </Flex>
      )}
    </Box>
  )
}
