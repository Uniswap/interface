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
import { textVariants, Theme } from 'ui/src/theme/restyle'

// base animated text component using a TextInput
// forked from https://github.com/wcandillon/react-native-redash/blob/master/src/ReText.tsx
Animated.addWhitelistedNativeProps({ text: true })

interface TextProps extends Omit<TextInputProps, 'value' | 'style'> {
  text: Animated.SharedValue<string>
  style?: Animated.AnimateProps<RNTextProps>['style']
}

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput)
export const BaseAnimatedText = (props: TextProps): JSX.Element => {
  const { style, text, ...rest } = props
  const animatedProps = useAnimatedProps(() => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return {
      text: text.value,
      // Here we use any because the text prop is not available in the type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any
  })
  return (
    <AnimatedTextInput
      editable={false}
      style={[style || undefined]}
      underlineColorAndroid="transparent"
      value={text.value}
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
})
