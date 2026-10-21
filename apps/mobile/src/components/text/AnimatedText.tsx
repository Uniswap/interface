import { Flex, type TextProps as TamaTextProps, TextLoaderWrapper, useSporeColors } from '@universe/mycelium'
import type { SporeColor } from '@universe/mycelium/theme-hooks-compat'
import React from 'react'
import { StyleProp, StyleSheet, TextInput, TextInputProps, TextStyle, useWindowDimensions } from 'react-native'
import Animated, {
  createAnimatedPropAdapter,
  SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
} from 'react-native-reanimated'
import { fonts } from 'ui/src/theme'
// base animated text component using a TextInput
// forked from https://github.com/wcandillon/react-native-redash/blob/master/src/ReText.tsx
// and modified to support the loading state

type TextPropsBase = TamaTextProps & Omit<TextInputProps, 'value' | 'style'>

// reanimated 4.5 added the CSS-transition union (CSSStyle) to AnimatedProps<Props>['style'];
// combined with the StyleProp<TextStyle> nested inside it, comparing the composed
// [base, font, style] array against it exceeds tsc's type-comparison complexity limit
// (TS2859) and the CSSProperties branch (string fontSize etc.) rejects plain TextStyle
// composition (TS2322). Narrow to what this component actually accepts: plain text styles
// and useAnimatedStyle handles. Re-verify on reanimated bumps touching AnimatedProps.
type AnimatedTextStyleProp = StyleProp<TextStyle | ReturnType<typeof useAnimatedStyle<TextStyle>>>

type TextProps = TextPropsBase & {
  text?: SharedValue<string>
  style?: AnimatedTextStyleProp
  loading?: boolean | 'no-shimmer'
  loadingPlaceholderText?: string
}

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput)

// adapted from https://github.com/software-mansion/react-native-reanimated/blob/Reanimated2/src/reanimated2/PropAdapters.ts#L57,
// as Reanimated 3 does not contain the TextInputAdapter
const TextInputAdapter = createAnimatedPropAdapter(
  (props) => {
    'worklet'
    const keys = Object.keys(props)
    // convert text to value like RN does here: https://github.com/facebook/react-native/blob/f2c6279ca497b34d5a2bfbb6f2d33dc7a7bea02a/Libraries/Components/TextInput/TextInput.js#L878
    if (keys.includes('value')) {
      props['text'] = props['value']
      delete props['value']
    }
  },
  ['text'],
)

const BaseAnimatedText = ({
  style,
  text,
  loading,
  loadingPlaceholderText = '000.00',
  ...rest
}: TextProps): JSX.Element => {
  const animatedProps = useAnimatedProps(
    () => {
      // oxlint-disable-next-line typescript/no-unsafe-return
      return {
        text: text?.value,
        defaultValue: text?.value,
        // Here we use any because the text prop is not available in the type
        // oxlint-disable-next-line typescript/no-explicit-any -- Text prop not available in animated type definition
      } as any
    },
    [text],
    TextInputAdapter,
  )

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
      animatedProps={animatedProps}
      editable={false}
      style={style}
      underlineColorAndroid="transparent"
      {...rest}
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
export const AnimatedText = ({ style, variant = 'body2', color = '$neutral1', ...rest }: TextProps): JSX.Element => {
  const colors = useSporeColors()
  // Legacy resolved the variant through the Tamagui Text frame; the fonts table is that
  // frame's own metrics source, so reading it directly renders identically.
  const font = fonts[variant]
  // The spore map is keyed by the $-prefixed token itself; the partial widening turns an
  // unknown token into the neutral1 default instead of a throw.
  const sporeColors = colors as Partial<Record<string, SporeColor>>
  const resolvedColor =
    typeof color === 'string' && color.startsWith('$')
      ? (sporeColors[color]?.val ?? colors.neutral1.val)
      : (color as string)

  const { fontScale } = useWindowDimensions()
  const enableFontScaling = fontScale > 1
  const multiplier = font.maxFontSizeMultiplier

  return (
    <BaseAnimatedText
      {...rest}
      allowFontScaling={enableFontScaling}
      maxFontSizeMultiplier={multiplier}
      style={[
        styles.input,
        {
          color: resolvedColor,
          fontFamily: font.family,
          fontSize: font.fontSize,
          fontWeight: 'fontWeight' in font ? font.fontWeight : undefined,
          lineHeight: font.lineHeight,
        },
        style,
      ]}
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
