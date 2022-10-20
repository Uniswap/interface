import { createText, useResponsiveProp } from '@shopify/restyle'
import React, { ComponentProps } from 'react'
import Animated from 'react-native-reanimated'
import { textVariants } from 'src/styles/font'
import { Theme } from 'src/styles/theme'

type TextProps = ComponentProps<typeof ThemedText> & {
  maxFontSizeMultiplier?: number
  animated?: boolean
  noTextScaling?: boolean
}

const NO_TEXT_SCALING_MULTIPLIER = 1

// Use this text component throughout the app instead of
// Default RN Text for theme support
const ThemedText = createText<Theme>()
const ThemedAnimatedText = createText<Theme>(Animated.Text)

// Wrap themed restyle text component with RN Text component to add support for maxFontSizeMultiplier prop so app is still usable with large text
export const Text = ({ animated, maxFontSizeMultiplier, noTextScaling, ...rest }: TextProps) => {
  const variant = useResponsiveProp(rest.variant ?? 'bodySmall') as keyof typeof textVariants
  const multiplier = noTextScaling
    ? NO_TEXT_SCALING_MULTIPLIER
    : maxFontSizeMultiplier ?? textVariants[variant].maxFontSizeMultiplier
  if (animated) {
    return <ThemedAnimatedText maxFontSizeMultiplier={multiplier} {...rest} />
  }
  return <ThemedText maxFontSizeMultiplier={multiplier} {...rest} />
}
