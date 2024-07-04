import { forwardRef, useCallback, useEffect, useMemo, useState } from 'react'
import { AppState, Keyboard, KeyboardTypeOptions, TextInput as NativeTextInput } from 'react-native'
import { getNumberFormatSettings } from 'react-native-localize'
import { Text } from 'ui/src'
import { TextInput, TextInputProps } from 'uniswap/src/components/input/TextInput'
import { FiatCurrencyInfo } from 'uniswap/src/features/fiatOnRamp/types'
import { truncateToMaxDecimals } from 'utilities/src/format/truncateToMaxDecimals'
import { useAppFiatCurrencyInfo } from 'wallet/src/features/fiatCurrency/hooks'

const numericInputRegex = RegExp('^\\d*(\\.\\d*)?$') // Matches only numeric values without commas

type Props = {
  adjustWidthToContent?: boolean
  fiatCurrencyInfo?: FiatCurrencyInfo
  dimTextColor?: boolean
  maxDecimals?: number
} & TextInputProps

export function replaceSeparators({
  value,
  groupingSeparator,
  decimalSeparator,
  groupingOverride,
  decimalOverride,
}: {
  value: string
  groupingSeparator?: string
  decimalSeparator: string
  groupingOverride?: string
  decimalOverride: string
}): string {
  let outputParts = value.split(decimalSeparator)
  if (groupingSeparator && groupingOverride != null) {
    outputParts = outputParts.map((part) =>
      // eslint-disable-next-line security/detect-non-literal-regexp
      part.replace(new RegExp(`\\${groupingSeparator}`, 'g'), groupingOverride),
    )
  }
  return outputParts.join(decimalOverride)
}

export function parseValue({
  value,
  decimalSeparator,
  groupingSeparator,
  showSoftInputOnFocus,
  nativeKeyboardDecimalSeparator,
  maxDecimals,
}: {
  value?: string
  decimalSeparator: string
  groupingSeparator: string
  showSoftInputOnFocus?: boolean
  nativeKeyboardDecimalSeparator: string
  maxDecimals?: number
}): string {
  let parsedValue = value?.trim() ?? ''

  // Replace all non-numeric characters, leaving the decimal and thousand separators.
  parsedValue = parsedValue.replace(/[^0-9.,]/g, '')

  // TODO(MOB-2385): replace this temporary solution for native keyboard.
  if (showSoftInputOnFocus && nativeKeyboardDecimalSeparator !== decimalSeparator) {
    parsedValue = replaceSeparators({
      value: parsedValue,
      decimalSeparator: nativeKeyboardDecimalSeparator,
      decimalOverride: decimalSeparator,
    })
  }

  parsedValue = replaceSeparators({
    value: parsedValue,
    groupingSeparator,
    decimalSeparator,
    groupingOverride: '',
    decimalOverride: '.',
  })

  if (maxDecimals === undefined) {
    return parsedValue
  }

  return truncateToMaxDecimals({
    value: parsedValue,
    maxDecimals,
  })
}

export const AmountInput = forwardRef<NativeTextInput, Props>(function _AmountInput(
  {
    onChangeText,
    value,
    adjustWidthToContent,
    dimTextColor,
    showSoftInputOnFocus,
    maxDecimals,
    fiatCurrencyInfo,
    ...rest
  },
  ref,
) {
  const appFiatCurrencyInfo = useAppFiatCurrencyInfo()
  const targetFiatCurrencyInfo = fiatCurrencyInfo || appFiatCurrencyInfo
  const { groupingSeparator, decimalSeparator } = targetFiatCurrencyInfo
  const { decimalSeparator: nativeKeyboardDecimalSeparator } = getNumberFormatSettings()

  const invalidInput = value && !numericInputRegex.test(value)

  useEffect(() => {
    // Resets input if non-numeric value is passed
    if (invalidInput) {
      onChangeText?.('')
    }
  }, [invalidInput, onChangeText, value])

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

  const [width, setWidth] = useState(0)
  const textInputProps: TextInputProps = useMemo(
    () => ({
      ref,
      color: !value || dimTextColor ? '$neutral3' : '$neutral1',
      keyboardType: 'numeric' as KeyboardTypeOptions,
      value: formattedValue,
      onChangeText: handleChange,
      ...rest,
      ...(adjustWidthToContent ? { width } : {}),
    }),
    [ref, value, dimTextColor, formattedValue, handleChange, rest, width, adjustWidthToContent],
  )
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (showSoftInputOnFocus || nextAppState !== 'active') {
        return
      }
      // Dismiss keyboard when app is foregrounded (showSoftInputOnFocus doesn't
      // work when the app activates from the background)
      Keyboard.dismiss()
    })

    return (): void => {
      subscription.remove()
    }
  }, [showSoftInputOnFocus])

  // break down into two different components depending on value of showSoftInputOnFocus
  // when showSoftInputOnFocus value changes from false to true, React does not remount the component
  // and therefore the keyboard does not pop up on TextInput focus.
  // returning a separately named component guarantees the remount
  const textInputElement = showSoftInputOnFocus ? (
    <TextInputWithNativeKeyboard {...textInputProps} />
  ) : (
    <TextInput {...textInputProps} showSoftInputOnFocus={false} />
  )

  if (adjustWidthToContent) {
    return (
      <>
        <Text
          // Hidden element measures text width to keep input width consistent when a currency symbol is present,
          // preventing it from using all horizontal space.
          fontFamily="$heading"
          fontSize={textInputProps.fontSize}
          fontWeight="500"
          height={0}
          numberOfLines={1}
          overflow="hidden"
          position="absolute"
          onLayout={(e) =>
            setWidth(
              Math.min(
                e.nativeEvent.layout.width,
                typeof textInputProps.maxWidth === 'number' ? textInputProps.maxWidth : +Infinity,
              ),
            )
          }
        >
          {value || textInputProps.placeholder}
        </Text>
        {textInputElement}
      </>
    )
  }

  return textInputElement
})

const TextInputWithNativeKeyboard = forwardRef<NativeTextInput, TextInputProps>(function _TextInputWithNativeKeyboard(
  props: TextInputProps,
  ref,
) {
  return <TextInput ref={ref} {...props} />
})
