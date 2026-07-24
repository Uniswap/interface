import { isMobileApp } from '@universe/environment'
import { forwardRef, useCallback, useEffect, useMemo } from 'react'
import { getNumberFormatSettings } from 'react-native-localize'
import { Input, Text } from 'ui/src'
import { fonts } from 'ui/src/theme'
import { useTextWidth } from 'uniswap/src/components/AmountInput/useTextWidth'
import { numericInputEnforcer } from 'uniswap/src/components/AmountInput/utils/numericInputEnforcer'
import { parseValue } from 'uniswap/src/components/AmountInput/utils/parseValue'
import { replaceSeparators } from 'uniswap/src/components/AmountInput/utils/replaceSeparators'
import { TextInput, TextInputProps } from 'uniswap/src/components/input/TextInput'
import { useAppFiatCurrencyInfo } from 'uniswap/src/features/fiatCurrency/hooks'
import { FiatCurrencyInfo } from 'uniswap/src/features/fiatOnRamp/types'
import { useOnMobileAppState } from 'utilities/src/device/appState'
import { dismissNativeKeyboard } from 'utilities/src/device/keyboard/dismissNativeKeyboard'
import { noop } from 'utilities/src/react/noop'

// Default font size when not explicitly provided (matches heading2)
const DEFAULT_FONT_SIZE = fonts.heading2.fontSize

type Props = {
  adjustWidthToContent?: boolean
  fiatCurrencyInfo?: FiatCurrencyInfo
  dimTextColor?: boolean
  maxDecimals?: number
  inputEnforcer?: (value?: string) => boolean
} & TextInputProps

export const AmountInput = forwardRef<Input, Props>(function AmountInputInner(
  {
    onChangeText,
    value,
    adjustWidthToContent,
    dimTextColor,
    showSoftInputOnFocus,
    maxDecimals,
    fiatCurrencyInfo,
    inputEnforcer = numericInputEnforcer,
    ...rest
  },
  ref,
) {
  const appFiatCurrencyInfo = useAppFiatCurrencyInfo()
  const targetFiatCurrencyInfo = fiatCurrencyInfo || appFiatCurrencyInfo
  const { groupingSeparator, decimalSeparator } = targetFiatCurrencyInfo
  const { decimalSeparator: nativeKeyboardDecimalSeparator } = getNumberFormatSettings()

  useEffect(() => {
    // Resets input if non-numeric value is passed
    if (!inputEnforcer(value)) {
      onChangeText?.('')
    }
  }, [inputEnforcer, onChangeText, value])

  const handleChange = useCallback(
    (val: string) => {
      onChangeText?.(
        parseValue({
          value: val,
          decimalSeparator,
          groupingSeparator,
          showSoftInputOnFocus,
          nativeKeyboardDecimalSeparator,
          maxDecimals,
        }),
      )
    },
    [
      decimalSeparator,
      groupingSeparator,
      maxDecimals,
      nativeKeyboardDecimalSeparator,
      onChangeText,
      showSoftInputOnFocus,
    ],
  )

  const formattedValue = replaceSeparators({
    value: value ?? '',
    groupingSeparator: ',',
    decimalSeparator: '.',
    groupingOverride: '',
    decimalOverride: decimalSeparator,
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

  // Dismiss keyboard when mobile app is foregrounded (showSoftInputOnFocus doesn't work when the app activates from the background)
  useOnMobileAppState('active', showSoftInputOnFocus ? noop : dismissNativeKeyboard)

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
})

const TextInputWithNativeKeyboard = forwardRef<Input, TextInputProps>(function TextInputWithNativeKeyboardInner(
  props: TextInputProps,
  ref,
) {
  return <TextInput ref={ref} {...props} />
})
