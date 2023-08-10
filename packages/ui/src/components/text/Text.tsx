import { PropsWithChildren } from 'react'
import { useWindowDimensions } from 'react-native'
import { GetProps, styled, Text as TamaguiText } from 'tamagui'
import { Box } from 'ui/src/components/layout/Box'
import { Shimmer } from 'ui/src/components/loading/Shimmer'
import { HiddenFromScreenReaders } from 'ui/src/components/text/HiddenFromScreenReaders'
import { fonts } from 'ui/src/theme/fonts'

// import { createText, useResponsiveProp } from '@shopify/restyle'
// import { HiddenFromScreenReaders } from 'src/components/text/HiddenFromScreenReaders'
// import { textVariants } from 'ui/src/theme/restyle/font'
// import { Theme } from 'ui/src/theme/restyle/theme'

export const TextFrame = styled(TamaguiText, {
  // TODO(EXT-61): keep investigating how to get text to wrap
  wordWrap: 'break-word',
  flex: 1,
  flexGrow: 0, // Would expect the default to be this, but default seems to be 1
  flexWrap: 'wrap',

  variants: {
    // TODO: leverage font tokens instead
    // https://tamagui.dev/docs/core/configuration#font-tokens
    // https://tamagui.dev/docs/core/font-language
    variant: {
      headlineLarge: {
        fontFamily: '$heading',
        fontSize: fonts.headlineLarge.fontSize,
        lineHeight: fonts.headlineLarge.lineHeight,
        fontWeight: '600',
      },
      headlineMedium: {
        fontFamily: '$heading',
        fontSize: fonts.headlineMedium.fontSize,
        lineHeight: fonts.headlineMedium.lineHeight,
        fontWeight: '500',
      },
      headlineSmall: {
        fontFamily: '$heading',
        fontSize: fonts.headlineSmall.fontSize,
        lineHeight: fonts.headlineSmall.lineHeight,
        fontWeight: '500',
      },
      subheadLarge: {
        fontFamily: '$heading',
        fontSize: fonts.subheadLarge.fontSize,
        lineHeight: fonts.subheadLarge.lineHeight,
        fontWeight: '500',
      },
      subheadSmall: {
        fontFamily: '$heading',
        fontSize: fonts.subheadSmall.fontSize,
        lineHeight: fonts.subheadSmall.lineHeight,
        fontWeight: '500',
      },
      bodyLarge: {
        fontFamily: '$body',
        fontSize: fonts.bodyLarge.fontSize,
        lineHeight: fonts.bodyLarge.lineHeight,
        fontWeight: '500',
      },
      bodySmall: {
        fontFamily: '$body',
        fontSize: fonts.bodySmall.fontSize,
        lineHeight: fonts.bodySmall.lineHeight,
        fontWeight: '400',
      },
      bodyMicro: {
        fontFamily: '$body',
        fontSize: fonts.bodyMicro.fontSize,
        lineHeight: fonts.bodyMicro.lineHeight,
        fontWeight: '400',
      },
      buttonLabelLarge: {
        fontFamily: '$body',
        fontSize: fonts.buttonLabelLarge.fontSize,
        lineHeight: fonts.buttonLabelLarge.lineHeight,
        fontWeight: '600',
      },
      buttonLabelMedium: {
        fontFamily: '$body',
        fontSize: fonts.buttonLabelMedium.fontSize,
        lineHeight: fonts.buttonLabelMedium.lineHeight,
        fontWeight: '600',
      },
      buttonLabelSmall: {
        fontFamily: '$body',
        fontSize: fonts.buttonLabelSmall.fontSize,
        lineHeight: fonts.buttonLabelSmall.lineHeight,
        fontWeight: '600',
      },
      buttonLabelMicro: {
        fontFamily: '$body',
        fontSize: fonts.buttonLabelMicro.fontSize,
        lineHeight: fonts.buttonLabelMicro.lineHeight,
        fontWeight: '600',
      },
      monospace: {
        fontFamily: '$body',
        fontSize: fonts.bodySmall.fontSize,
        lineHeight: fonts.bodySmall.lineHeight,
      },
    },
  } as const,
})

type TextFrameProps = GetProps<typeof TextFrame>

export const DEFAULT_FONT_SCALE = 1

export type TextProps = TextFrameProps & {
  maxFontSizeMultiplier?: number
  animated?: boolean
  allowFontScaling?: boolean
  loading?: boolean | 'no-shimmer'
  loadingPlaceholderText?: string
}

// Use this text component throughout the app instead of
// Default RN Text for theme support

// const ThemedAnimatedText = createText<Theme>(Animated.Text)

const TextPlaceholder = ({ children }: PropsWithChildren<unknown>): JSX.Element => {
  return (
    <Box alignItems="center" flexDirection="row">
      <Box alignItems="center" flexDirection="row" position="relative">
        <HiddenFromScreenReaders>{children}</HiddenFromScreenReaders>
        <Box
          bg="$surface2"
          borderRadius="$rounded4"
          bottom="5%"
          left={0}
          position="absolute"
          right={0}
          top="5%"
        />
      </Box>
    </Box>
  )
}

const TextLoaderWrapper = ({
  children,
  loadingShimmer,
}: { loadingShimmer?: boolean } & PropsWithChildren<unknown>): JSX.Element => {
  const inner = <TextPlaceholder>{children}</TextPlaceholder>
  if (loadingShimmer) {
    return <Shimmer>{inner}</Shimmer>
  }

  return inner
}

/**
 * Use this component instead of the default React Native <Text> component anywhere text shows up throughout the app, so we can use the design system values for colors and sizes, and make sure all text looks and behaves the same way
 * @param loading Whether the text inside the component is still loading or not. Set this to true if whatever content goes inside the <Text> component is coming from a variable that might still be loading. This prop is optional and defaults to false. This prop can also be set to "no-shimmer" to enable a loading state without the shimmer effect.
 * @param loadingPlaceholderText - The text that the loader's size will be derived from. Pick something that's close to the same length as the final text is expected to be, e.g. if it's a ticker symbol, "XXX" might be a good placeholder text. This prop is optional and defaults to "$00.00".
 */
export const Text = ({
  loading = false,
  allowFontScaling,
  loadingPlaceholderText = '$00.00',
  ...rest
}: TextProps): JSX.Element => {
  const { fontScale } = useWindowDimensions()
  const enableFontScaling = allowFontScaling ?? fontScale > DEFAULT_FONT_SCALE

  // TODO implement
  // if (animated) {
  //   return (
  //     <ThemedAnimatedText
  //       allowFontScaling={enableFontScaling}
  //       maxFontSizeMultiplier={multiplier}
  //       {...rest}
  //     />
  //   )
  // }

  if (loading) {
    return (
      <TextLoaderWrapper loadingShimmer={loading !== 'no-shimmer'}>
        <TextFrame allowFontScaling={enableFontScaling} color="$none" opacity={0} {...rest}>
          {/* Important that `children` isn't used or rendered by <Text> when `loading` is true, because if the child of a <Text> component is a dynamic variable that might not be finished fetching yet, it'll result in an error until it's finished loading. We use `loadingPlaceholderText` to set the size of the loading element instead. */}
          {loadingPlaceholderText}
        </TextFrame>
      </TextLoaderWrapper>
    )
  }

  return <TextFrame allowFontScaling={enableFontScaling} {...rest} />
}
