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
import {
  StyleSheet,
  TextInput,
  TextInputProps,
  TextProps as RNTextProps,
  useWindowDimensions,
} from 'react-native'
import Animated, { useAnimatedProps } from 'react-native-reanimated'
import { DEFAULT_FONT_SCALE } from 'src/components/Text'
import { Flex } from 'ui/src'
import { TextLoaderWrapper } from 'ui/src/components/text/Text'
import { textVariants, Theme } from 'ui/src/theme/restyle'

// base animated text component using a TextInput
// forked from https://github.com/wcandillon/react-native-redash/blob/master/src/ReText.tsx
// and modified to support the loading state
Animated.addWhitelistedNativeProps({ text: true })

interface TextProps extends Omit<TextInputProps, 'value' | 'style'> {
  text?: Animated.SharedValue<string>
  style?: Animated.AnimateProps<RNTextProps>['style']
  loading?: boolean | 'no-shimmer'
  loadingPlaceholderText?: string
}

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput)

export const BaseAnimatedText = ({
  style,
  text,
  loading,
  loadingPlaceholderText = '$00.00',
  ...rest
}: TextProps): JSX.Element => {
  const animatedProps = useAnimatedProps(() => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return {
      text: text?.value,
      // Here we use any because the text prop is not available in the type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any
  })

  if (loading) {
    return (
      <TextLoaderWrapper loadingShimmer={loading !== 'no-shimmer'}>
        <Flex row>
          {/* Use empty input for loading shimmer height calculation (it is different
          than the text component height) */}
          <AnimatedTextInput
            editable={false}
            style={[style, styles.loadingInput]}
            underlineColorAndroid="transparent"
            {...rest}
          />
          {/* Use the text component to properly calculate the width of the loading shimmer.
          An input component with a width dependent on the length of the content was sometimes 
          rendered with a very small width regardless of the text passed as a value */}
          <Animated.Text style={[style, styles.loadingPlaceholder]}>
            {loadingPlaceholderText}
          </Animated.Text>
        </Flex>
      </TextLoaderWrapper>
    )
  }

  return (
    <AnimatedTextInput
      editable={false}
      style={[style || undefined]}
      underlineColorAndroid="transparent"
      value={text?.value}
      {...rest}
      {...{ animatedProps }}
    />
  )
}
// end of forked from https://github.com/wcandillon/react-native-redash/blob/master/src/ReText.tsx

// exposes restyle to base animated text
const StyledBaseAnimatedText = createRestyleComponent<
  VariantProps<Theme, 'textVariants'> &
    TypographyProps<Theme> &
    ColorProps<Theme> &
    React.ComponentProps<typeof BaseAnimatedText>,
  Theme
>([createVariant({ themeKey: 'textVariants' }), typography, color], BaseAnimatedText)

// wrapped around restyled animated text with convenience props
export const AnimatedText = (
  props: React.ComponentProps<typeof StyledBaseAnimatedText>
): JSX.Element => {
  const { fontScale } = useWindowDimensions()
  const enableFontScaling = fontScale > DEFAULT_FONT_SCALE

  const variant = useResponsiveProp(props.variant ?? 'bodySmall') as keyof typeof textVariants
  const multiplier = textVariants[variant].maxFontSizeMultiplier

  return (
    <StyledBaseAnimatedText
      {...props}
      allowFontScaling={enableFontScaling}
      maxFontSizeMultiplier={multiplier}
      style={[styles.input, props.style]}
    />
  )
}

const styles = StyleSheet.create({
  input: {
    padding: 0, // inputs have default padding on Android
  },
  loadingInput: {
    marginHorizontal: 0,
    opacity: 0,
    paddingHorizontal: 0,
    width: 0,
  },
  loadingPlaceholder: {
    opacity: 0,
  },
})
