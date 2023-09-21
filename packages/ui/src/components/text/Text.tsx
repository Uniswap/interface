import { PropsWithChildren } from 'react'
import { useWindowDimensions } from 'react-native'
import { GetProps, styled, Text as TamaguiText } from 'tamagui'
import { Box } from 'ui/src/components/layout/Box'
import { HiddenFromScreenReaders } from 'ui/src/components/text/HiddenFromScreenReaders'
import { Shimmer } from 'ui/src/loading/Shimmer'
import { fonts } from 'ui/src/theme/fonts'

// import { createText, useResponsiveProp } from '@shopify/restyle'
// import { HiddenFromScreenReaders } from 'src/components/text/HiddenFromScreenReaders'
// import { textVariants } from 'ui/src/theme/restyle/font'
// import { Theme } from 'ui/src/theme/restyle/theme'

export const TextFrame = styled(TamaguiText, {
  fontFamily: '$body',
  wordWrap: 'break-word',

  variants: {
    // TODO: leverage font tokens instead
    // https://tamagui.dev/docs/core/configuration#font-tokens
    // https://tamagui.dev/docs/core/font-language
    variant: {
      heading1: {
        fontFamily: '$heading',
        fontSize: fonts.heading1.fontSize,
        lineHeight: fonts.heading1.lineHeight,
        fontWeight: fonts.heading1.fontWeight,
      },
      heading2: {
        fontFamily: '$heading',
        fontSize: fonts.heading2.fontSize,
        lineHeight: fonts.heading2.lineHeight,
        fontWeight: fonts.heading2.fontWeight,
      },
      heading3: {
        fontFamily: '$heading',
        fontSize: fonts.heading3.fontSize,
        lineHeight: fonts.heading3.lineHeight,
        fontWeight: fonts.heading3.fontWeight,
      },
      subheading1: {
        fontFamily: '$subHeading',
        fontSize: fonts.subheading1.fontSize,
        lineHeight: fonts.subheading1.lineHeight,
        fontWeight: fonts.subheading1.fontWeight,
      },
      subheading2: {
        fontFamily: '$subHeading',
        fontSize: fonts.subheading2.fontSize,
        lineHeight: fonts.subheading2.lineHeight,
        fontWeight: fonts.subheading2.fontWeight,
      },
      body1: {
        fontFamily: '$body',
        fontSize: fonts.body1.fontSize,
        lineHeight: fonts.body1.lineHeight,
        fontWeight: fonts.body1.fontWeight,
      },
      body2: {
        fontFamily: '$body',
        fontSize: fonts.body2.fontSize,
        lineHeight: fonts.body2.lineHeight,
        fontWeight: fonts.body2.fontWeight,
      },
      body3: {
        fontFamily: '$body',
        fontSize: fonts.body3.fontSize,
        lineHeight: fonts.body3.lineHeight,
        fontWeight: fonts.body3.fontWeight,
      },
      buttonLabel1: {
        fontFamily: '$body',
        fontSize: fonts.buttonLabel1.fontSize,
        lineHeight: fonts.buttonLabel1.lineHeight,
        fontWeight: fonts.buttonLabel1.fontWeight,
      },
      buttonLabel2: {
        fontFamily: '$body',
        fontSize: fonts.buttonLabel2.fontSize,
        lineHeight: fonts.buttonLabel2.lineHeight,
        fontWeight: fonts.buttonLabel2.fontWeight,
      },
      buttonLabel3: {
        fontFamily: '$body',
        fontSize: fonts.buttonLabel3.fontSize,
        lineHeight: fonts.buttonLabel3.lineHeight,
        fontWeight: fonts.buttonLabel3.fontWeight,
      },
      buttonLabel4: {
        fontFamily: '$body',
        fontSize: fonts.buttonLabel4.fontSize,
        lineHeight: fonts.buttonLabel4.lineHeight,
        fontWeight: fonts.buttonLabel4.fontWeight,
      },
      monospace: {
        fontFamily: '$body',
        fontSize: fonts.body2.fontSize,
        lineHeight: fonts.body2.lineHeight,
      },
    },
  } as const,

  defaultVariants: {
    variant: 'body2',
  },
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

export const TextPlaceholder = ({ children }: PropsWithChildren<unknown>): JSX.Element => {
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

export const TextLoaderWrapper = ({
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
        <TextFrame allowFontScaling={enableFontScaling} color="$transparent" opacity={0} {...rest}>
          {/* Important that `children` isn't used or rendered by <Text> when `loading` is true, because if the child of a <Text> component is a dynamic variable that might not be finished fetching yet, it'll result in an error until it's finished loading. We use `loadingPlaceholderText` to set the size of the loading element instead. */}
          {loadingPlaceholderText}
        </TextFrame>
      </TextLoaderWrapper>
    )
  }

  return <TextFrame allowFontScaling={enableFontScaling} color="$neutral1" {...rest} />
}
