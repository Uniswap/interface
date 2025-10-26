import { PropsWithChildren } from 'react'
import { GetProps, styled, Text as TamaguiText } from 'tamagui'
import { Flex } from 'ui/src/components/layout'
import { HiddenFromScreenReaders } from 'ui/src/components/text/HiddenFromScreenReaders'
import { useEnableFontScaling } from 'ui/src/components/text/useEnableFontScaling'
import { Skeleton } from 'ui/src/loading/Skeleton'
import { fonts } from 'ui/src/theme/fonts'
import { isWebPlatform } from 'utilities/src/platform'

export const TextFrame = styled(TamaguiText, {
  fontFamily: '$body',
  wordWrap: 'break-word',

  variants: {
    variant: {
      heading1: {
        fontFamily: '$heading',
        fontSize: '$large',
        lineHeight: '$large',
        fontWeight: '$book',
        maxFontSizeMultiplier: fonts.heading1.maxFontSizeMultiplier,
      },
      heading2: {
        fontFamily: '$heading',
        fontSize: '$medium',
        lineHeight: '$medium',
        fontWeight: '$book',
        maxFontSizeMultiplier: fonts.heading2.maxFontSizeMultiplier,
      },
      heading3: {
        fontFamily: '$heading',
        fontSize: '$small',
        lineHeight: '$small',
        fontWeight: '$book',
        maxFontSizeMultiplier: fonts.heading3.maxFontSizeMultiplier,
      },
      subheading1: {
        fontFamily: '$subHeading',
        fontSize: '$large',
        lineHeight: '$large',
        fontWeight: '$book',
        maxFontSizeMultiplier: fonts.subheading1.maxFontSizeMultiplier,
      },
      subheading2: {
        fontFamily: '$subHeading',
        fontSize: '$small',
        lineHeight: '$small',
        fontWeight: '$book',
        maxFontSizeMultiplier: fonts.subheading2.maxFontSizeMultiplier,
      },
      body1: {
        fontFamily: '$body',
        fontSize: '$large',
        lineHeight: '$large',
        fontWeight: '$book',
        maxFontSizeMultiplier: fonts.body1.maxFontSizeMultiplier,
      },
      body2: {
        fontFamily: '$body',
        fontSize: '$medium',
        lineHeight: '$medium',
        fontWeight: '$book',
        maxFontSizeMultiplier: fonts.body2.maxFontSizeMultiplier,
      },
      body3: {
        fontFamily: '$body',
        fontSize: '$small',
        lineHeight: '$small',
        fontWeight: '$book',
        maxFontSizeMultiplier: fonts.body3.maxFontSizeMultiplier,
      },
      body4: {
        fontFamily: '$body',
        fontSize: '$micro',
        lineHeight: '$micro',
        fontWeight: '$book',
        maxFontSizeMultiplier: fonts.body4.maxFontSizeMultiplier,
      },
      buttonLabel1: {
        fontFamily: '$button',
        fontSize: '$large',
        lineHeight: '$large',
        fontWeight: '$medium',
        maxFontSizeMultiplier: fonts.buttonLabel1.maxFontSizeMultiplier,
      },
      buttonLabel2: {
        fontFamily: '$button',
        fontSize: '$medium',
        lineHeight: '$medium',
        fontWeight: '$medium',
        maxFontSizeMultiplier: fonts.buttonLabel2.maxFontSizeMultiplier,
      },
      buttonLabel3: {
        fontFamily: '$button',
        fontSize: '$small',
        lineHeight: '$small',
        fontWeight: '$medium',
        maxFontSizeMultiplier: fonts.buttonLabel3.maxFontSizeMultiplier,
      },
      buttonLabel4: {
        fontFamily: '$button',
        fontSize: '$micro',
        lineHeight: '$micro',
        fontWeight: '$medium',
        maxFontSizeMultiplier: fonts.buttonLabel4.maxFontSizeMultiplier,
      },
      monospace: {
        fontFamily: '$body',
        fontSize: fonts.body2.fontSize,
        lineHeight: fonts.body2.lineHeight,
        fontWeight: '$book',
        maxFontSizeMultiplier: fonts.body2.maxFontSizeMultiplier,
      },
    },
  } as const,

  defaultVariants: {
    variant: 'body2',
  },
})

TextFrame.displayName = 'TextFrame'

const Heading1 = styled(TextFrame, {
  tag: 'h1',
})

Heading1.displayName = 'Heading1'

const Heading2 = styled(TextFrame, {
  tag: 'h2',
})

Heading2.displayName = 'Heading2'

const Heading3 = styled(TextFrame, {
  tag: 'h3',
})

Heading3.displayName = 'Heading3'

type TextFrameProps = GetProps<typeof TextFrame>

export type TextProps = TextFrameProps & {
  maxFontSizeMultiplier?: number
  allowFontScaling?: boolean
  loading?: boolean | 'no-shimmer'
  loadingPlaceholderText?: string
  title?: string
}

// Use this text component throughout the app instead of
// Default RN Text for theme support

export const TextPlaceholder = ({ children }: PropsWithChildren<unknown>): JSX.Element => {
  return (
    <Flex row alignItems="center" testID="text-placeholder">
      <Flex row alignItems="center" position="relative">
        <HiddenFromScreenReaders>{children}</HiddenFromScreenReaders>
        <Flex
          backgroundColor={isWebPlatform ? '$surface3' : '$surface2'}
          borderRadius="$roundedFull"
          bottom="5%"
          left={0}
          position="absolute"
          right={0}
          top="5%"
        />
      </Flex>
    </Flex>
  )
}

export const TextLoaderWrapper = ({
  children,
  loadingShimmer,
}: { loadingShimmer?: boolean } & PropsWithChildren<unknown>): JSX.Element => {
  const inner = <TextPlaceholder>{children}</TextPlaceholder>
  if (loadingShimmer) {
    return <Skeleton>{inner}</Skeleton>
  }

  return inner
}

const TEXT_COMPONENTS = {
  heading1: Heading1,
  heading2: Heading2,
  heading3: Heading3,
} as const

const getTextComponent = (variant: TextProps['variant']): typeof TextFrame => {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  return TEXT_COMPONENTS[variant as keyof typeof TEXT_COMPONENTS] ?? TextFrame
}

/**
 * Use this component instead of the default React Native <Text> component anywhere text shows up throughout the app, so we can use the design system values for colors and sizes, and make sure all text looks and behaves the same way
 * @param loading Whether the text inside the component is still loading or not. Set this to true if whatever content goes inside the <Text> component is coming from a variable that might still be loading. This prop is optional and defaults to false. This prop can also be set to "no-shimmer" to enable a loading state without the shimmer effect.
 * @param loadingPlaceholderText - The text that the loader's size will be derived from. Pick something that's close to the same length as the final text is expected to be, e.g. if it's a ticker symbol, "XXX" might be a good placeholder text. This prop is optional and defaults to "000.00".
 */
export const Text = TextFrame.styleable<TextProps>(
  ({ loading = false, allowFontScaling, loadingPlaceholderText = '000.00', ...rest }: TextProps, ref): JSX.Element => {
    const enableFontScaling = useEnableFontScaling(allowFontScaling)
    const TextComponent = getTextComponent(rest.variant)

    if (loading) {
      return (
        <TextLoaderWrapper loadingShimmer={loading !== 'no-shimmer'}>
          <TextComponent ref={ref} allowFontScaling={enableFontScaling} color="$transparent" opacity={0} {...rest}>
            {/* Important that `children` isn't used or rendered by <Text> when `loading` is true, because if the child of a <Text> component is a dynamic variable that might not be finished fetching yet, it'll result in an error until it's finished loading. We use `loadingPlaceholderText` to set the size of the loading element instead. */}
            {loadingPlaceholderText}
          </TextComponent>
        </TextLoaderWrapper>
      )
    }

    return <TextComponent ref={ref} allowFontScaling={enableFontScaling} color="$neutral1" {...rest} />
  },
)
