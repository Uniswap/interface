import React from 'react'
import { TextProps as RNTextProps, StyleSheet, TextInput, TextInputProps, useWindowDimensions } from 'react-native'
import Animated, { useAnimatedProps } from 'react-native-reanimated'
import { Flex, TextProps as TamaTextProps, TextFrame, TextLoaderWrapper, usePropsAndStyle } from 'ui/src'
import { fonts } from 'ui/src/theme'

// base animated text component using a TextInput
// forked from https://github.com/wcandillon/react-native-redash/blob/master/src/ReText.tsx
// and modified to support the loading state
Animated.addWhitelistedNativeProps({ text: true })

type TextPropsBase = TamaTextProps & Omit<TextInputProps, 'value' | 'style'>

type TextProps = TextPropsBase & {
  text?: Animated.SharedValue<string>
  style?: Animated.AnimateProps<RNTextProps>['style']
  loading?: boolean | 'no-shimmer'
  loadingPlaceholderText?: string
}

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput)

const BaseAnimatedText = ({
  style,
  text,
  loading,
  loadingPlaceholderText = '000.00',
  ...rest
}: TextProps): JSX.Element => {
  const animatedProps = useAnimatedProps(() => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return {
      text: text?.value,
      // Here we use any because the text prop is not available in the type
      // biome-ignore lint/suspicious/noExplicitAny: Text prop not available in animated type definition
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
          <Animated.Text style={[style, styles.loadingPlaceholder]}>{loadingPlaceholderText}</Animated.Text>
        </Flex>
      </TextLoaderWrapper>
    )
  }

  return (
    <AnimatedTextInput
      editable={false}
      style={style}
      underlineColorAndroid="transparent"
      value={text?.value}
      {...rest}
      {...{ animatedProps }}
    />
  )
}
// end of forked from https://github.com/wcandillon/react-native-redash/blob/master/src/ReText.tsx

// gives you tamagui props with reanimated support
/**
 * @deprecated Prefer <Text animation="" />
 *
 *    See: https://tamagui.dev/docs/core/animations
 *
 * TODO(MOB-1948): Remove this
 * */
export const AnimatedText = ({ style, ...propsIn }: TextProps): JSX.Element => {
  const variant = propsIn.variant ?? 'body2'
  const [props, textStyles] = usePropsAndStyle(
    {
      variant,
      ...propsIn,
    },
    {
      forComponent: TextFrame,
    },
  )

  const { fontScale } = useWindowDimensions()
  const enableFontScaling = fontScale > 1
  const multiplier = fonts[variant].maxFontSizeMultiplier

  return (
    <BaseAnimatedText
      // biome-ignore lint/suspicious/noExplicitAny: Ambigous to type
      {...(props as any)}
      allowFontScaling={enableFontScaling}
      maxFontSizeMultiplier={multiplier}
      style={[styles.input, textStyles, style]}
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
