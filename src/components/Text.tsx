import { createText, useResponsiveProp } from '@shopify/restyle'
import React, { ComponentProps, PropsWithChildren } from 'react'
import Animated from 'react-native-reanimated'
import { Box } from 'src/components/layout'
import { HiddenFromScreenReaders } from 'src/components/text/HiddenFromScreenReaders'
import { textVariants } from 'src/styles/font'
import { Theme } from 'src/styles/theme'

type TextProps = ComponentProps<typeof ThemedText> & {
  maxFontSizeMultiplier?: number
  animated?: boolean
  noTextScaling?: boolean
  loaderOnly?: boolean
} & Pick<ComponentProps<typeof Box>, 'height' | 'width'>

const NO_TEXT_SCALING_MULTIPLIER = 1

// Use this text component throughout the app instead of
// Default RN Text for theme support
const ThemedText = createText<Theme>()
const ThemedAnimatedText = createText<Theme>(Animated.Text)

const TextLoaderWrapper = ({
  children,
  height = '90%',
  width = 'auto',
}: PropsWithChildren<TextProps>) => {
  return (
    <Box alignItems="center" flexDirection="row">
      <Box
        bg="background3"
        borderRadius="xs"
        // 90% height (or anything less than 100%) plus the wrapping flex row allow us to get the loader to take up exactly the same amount of space as the text, without looking visually weird when the final text layout doesn't have any gap between two vertically stacked text boxes, e.g. header and body (otherwise the loaders would just be two boxes with no gap between them, OR the loader would take up more space than the final layout if we add a gap)
        height={height}
        width={width}>
        <HiddenFromScreenReaders>{children}</HiddenFromScreenReaders>
      </Box>
    </Box>
  )
}

// Wrap themed restyle text component with RN Text component to add support for maxFontSizeMultiplier prop so app is still usable with large text
export const Text = ({
  animated,
  loaderOnly,
  maxFontSizeMultiplier,
  noTextScaling,
  height,
  width,
  ...rest
}: TextProps) => {
  const variant = useResponsiveProp(rest.variant ?? 'bodySmall') as keyof typeof textVariants
  const multiplier = noTextScaling
    ? NO_TEXT_SCALING_MULTIPLIER
    : maxFontSizeMultiplier ?? textVariants[variant].maxFontSizeMultiplier

  if (animated) {
    return <ThemedAnimatedText maxFontSizeMultiplier={multiplier} {...rest} />
  }

  if (loaderOnly) {
    return (
      <TextLoaderWrapper height={height} width={width}>
        <ThemedText color="none" maxFontSizeMultiplier={multiplier} opacity={0} {...rest} />
      </TextLoaderWrapper>
    )
  }

  return <ThemedText maxFontSizeMultiplier={multiplier} {...rest} />
}
