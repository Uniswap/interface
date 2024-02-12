import { forwardRef, useCallback, useEffect, useMemo } from 'react'
import { AppState, Keyboard, KeyboardTypeOptions, TextInput as NativeTextInput } from 'react-native'
import { getNumberFormatSettings } from 'react-native-localize'
import { TextInput, TextInputProps } from 'wallet/src/components/input/TextInput'
import { FiatCurrencyInfo, useAppFiatCurrencyInfo } from 'wallet/src/features/fiatCurrency/hooks'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'

const numericInputRegex = RegExp('^\\d*(\\.\\d*)?$') // Matches only numeric values without commas

type Props = {
  showCurrencySign: boolean
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
      part.replace(new RegExp(`\\${groupingSeparator}`, 'g'), groupingOverride)
    )
  }
  return outputParts.join(decimalOverride)
}

export function parseValue({
  value,
  decimalSeparator,
  groupingSeparator,
  showCurrencySign,
  showSoftInputOnFocus,
  nativeKeyboardDecimalSeparator,
  maxDecimals,
}: {
  value?: string
  decimalSeparator: string
  groupingSeparator: string
  showCurrencySign: boolean
  showSoftInputOnFocus?: boolean
  nativeKeyboardDecimalSeparator: string
  maxDecimals?: number
}): string {
  let parsedValue = value?.trim() ?? ''
  parsedValue = showCurrencySign ? parsedValue.substring(1) : parsedValue

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

  const [beforeDecimalSeparator, afterDecimalSeparator] = parsedValue.split('.')

  if (maxDecimals === undefined || afterDecimalSeparator === undefined) {
    return parsedValue
  }

  return `${beforeDecimalSeparator}.${afterDecimalSeparator.substring(0, maxDecimals)}`
}

export const AmountInput = forwardRef<NativeTextInput, Props>(function _AmountInput(
  {
    onChangeText,
    value,
    showCurrencySign,
    dimTextColor,
    showSoftInputOnFocus,
    maxDecimals,
    fiatCurrencyInfo,
    ...rest
  },
  ref
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
          showCurrencySign,
          showSoftInputOnFocus,
          nativeKeyboardDecimalSeparator,
          maxDecimals,
        })
      )
    },
    [
      decimalSeparator,
      groupingSeparator,
      maxDecimals,
      nativeKeyboardDecimalSeparator,
      onChangeText,
      showCurrencySign,
      showSoftInputOnFocus,
    ]
  )

  const { addFiatSymbolToNumber } = useLocalizationContext()

  let formattedValue = replaceSeparators({
    value: value ?? '',
    groupingSeparator: ',',
    decimalSeparator: '.',
    groupingOverride: '',
    decimalOverride: decimalSeparator,
  })
  formattedValue =
    showCurrencySign && targetFiatCurrencyInfo
      ? addFiatSymbolToNumber({
          value: formattedValue,
          currencyCode: targetFiatCurrencyInfo.code,
          currencySymbol: targetFiatCurrencyInfo.symbol,
        })
      : formattedValue

  const textInputProps: TextInputProps = useMemo(
    () => ({
      ref,
      color: !value || dimTextColor ? '$neutral3' : '$neutral1',
      keyboardType: 'numeric' as KeyboardTypeOptions,
      value: formattedValue,
      onChangeText: handleChange,
      ...rest,
    }),
    [ref, value, dimTextColor, formattedValue, handleChange, rest]
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
  if (showSoftInputOnFocus) {
    return <TextInputWithNativeKeyboard {...textInputProps} />
  }

  return <TextInput {...textInputProps} showSoftInputOnFocus={false} />
})

const TextInputWithNativeKeyboard = forwardRef<NativeTextInput, TextInputProps>(
  function _TextInputWithNativeKeyboard(props: TextInputProps, ref) {
    return <TextInput ref={ref} {...props} />
  }
)
