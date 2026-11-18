import { isMobileApp } from '@universe/environment'
import { Input, Text, fonts } from '@universe/mycelium'
import { forwardRef, type ForwardRefExoticComponent, type RefAttributes, useMemo } from 'react'
// mycelium's `fonts` is the flat web table; ui's applies the native +1 ramp this default depends on
import { useAmountInputText } from 'uniswap/src/components/AmountInput/useAmountInputText'
import { useTextWidth } from 'uniswap/src/components/AmountInput/useTextWidth'
import { TextInput, TextInputProps } from 'uniswap/src/components/input/TextInput'
import { FiatCurrencyInfo } from 'uniswap/src/features/fiatOnRamp/types'

// Default font size when not explicitly provided (matches heading2)
const DEFAULT_FONT_SIZE = fonts.heading2.fontSize

type Props = {
  adjustWidthToContent?: boolean
  fiatCurrencyInfo?: FiatCurrencyInfo
  dimTextColor?: boolean
  maxDecimals?: number
  inputEnforcer?: (value?: string) => boolean
} & TextInputProps

export const AmountInput: ForwardRefExoticComponent<Props & RefAttributes<Input>> = forwardRef<Input, Props>(
  function AmountInputInner(
    {
      onChangeText,
      value,
      adjustWidthToContent,
      dimTextColor,
      showSoftInputOnFocus,
      maxDecimals,
      fiatCurrencyInfo,
      inputEnforcer,
      ...rest
    },
    ref,
  ) {
    const { formattedValue, onChangeFormattedText: handleChange } = useAmountInputText({
      value,
      onChangeText,
      showSoftInputOnFocus,
      maxDecimals,
      fiatCurrencyInfo,
      inputEnforcer,
    })

    // Estimate width to prevent overflown input on web
    const fontSize = typeof rest.fontSize === 'number' ? rest.fontSize : DEFAULT_FONT_SIZE
    const measurementText = formattedValue || rest.placeholder || ''
    const maxWidth = typeof rest.maxWidth === 'number' ? rest.maxWidth : undefined
    const { width, onLayout } = useTextWidth({
      text: measurementText,
      maxWidth,
      enabled: adjustWidthToContent,
      fontSize: adjustWidthToContent ? fontSize : undefined,
      // on mobile, use onLayout to prevent performance stutters
      useLayoutOnly: isMobileApp,
    })

    const textInputProps: TextInputProps = useMemo(
      () => ({
        ref,
        color: !value || dimTextColor ? '$neutral2' : '$neutral1',
        keyboardType: 'decimal-pad',
        value: formattedValue,
        onChangeText: handleChange,
        ...rest,
        // Override fontSize to ensure TextInput and hidden Text use the same numeric value.
        ...(adjustWidthToContent ? { fontSize } : {}),
        ...(width !== undefined ? { width } : {}),
      }),
      [ref, value, dimTextColor, formattedValue, handleChange, rest, width, adjustWidthToContent, fontSize],
    )

    // break down into two different components depending on value of showSoftInputOnFocus
    // when showSoftInputOnFocus value changes from false to true, React does not remount the component
    // and therefore the keyboard does not pop up on TextInput focus.
    // returning a separately named component guarantees the remount
    const textInputElement = showSoftInputOnFocus ? (
      <TextInputWithNativeKeyboard {...textInputProps} />
    ) : (
      <TextInput {...textInputProps} showSoftInputOnFocus={false} />
    )

    // Always render the same fragment shape (with the input at a stable position) so toggling
    // `adjustWidthToContent` (e.g. switching between fiat and crypto) doesn't remount the input,
    // which would drop focus/cursor and cause a visible bounce.
    return (
      <>
        <Text
          // Hidden element measures actual text width when adjustWidthToContent is enabled.
          // On web, width is estimated instantly, then refined when onLayout fires.
          // On mobile, width comes only from onLayout measurement.
          fontFamily="$heading"
          fontSize={fontSize}
          fontWeight="500"
          // mycelium's Text doesn't bake a default cap into its `body2` variant the way ui/src's
          // did; pass it explicitly so the measured width still matches the rendered TextInput
          // above 1.4x system font scaling.
          maxFontSizeMultiplier={fonts.body2.maxFontSizeMultiplier}
          height={0}
          numberOfLines={1}
          overflow="hidden"
          pointerEvents="none"
          position="absolute"
          onLayout={adjustWidthToContent ? onLayout : undefined}
        >
          {measurementText}
        </Text>
        {textInputElement}
      </>
    )
  },
)

const TextInputWithNativeKeyboard = forwardRef<Input, TextInputProps>(function TextInputWithNativeKeyboardInner(
  props: TextInputProps,
  ref,
) {
  return <TextInput ref={ref} {...props} />
})
