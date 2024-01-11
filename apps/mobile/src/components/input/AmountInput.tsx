import React, { forwardRef, useCallback, useEffect, useMemo } from 'react'
import { AppState, Keyboard, KeyboardTypeOptions, TextInput as NativeTextInput } from 'react-native'
import { getNumberFormatSettings } from 'react-native-localize'
import { TextInput, TextInputProps } from 'src/components/input/TextInput'
import { useMoonpayFiatCurrencySupportInfo } from 'src/features/fiatOnRamp/hooks'
import { useAppFiatCurrencyInfo } from 'wallet/src/features/fiatCurrency/hooks'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'

const numericInputRegex = RegExp('^\\d*(\\.\\d*)?$') // Matches only numeric values without commas

type Props = {
  showCurrencySign: boolean
  dimTextColor?: boolean
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

export const AmountInput = forwardRef<NativeTextInput, Props>(function _AmountInput(
  { onChangeText, value, showCurrencySign, dimTextColor, showSoftInputOnFocus, ...rest },
  ref
) {
  const { groupingSeparator, decimalSeparator } = useAppFiatCurrencyInfo()
  const invalidInput = value && !numericInputRegex.test(value)

  useEffect(() => {
    // Resets input if non-numberic value is passed
    if (invalidInput) {
      onChangeText?.('')
    }
  }, [invalidInput, onChangeText, value])

  const handleChange = useCallback(
    (text: string) => {
      let parsedText = showCurrencySign ? text.substring(1) : text
      const { decimalSeparator: keyboardDecimalSeparator } = getNumberFormatSettings()

      // TODO MOB-2385 replace this temporary solution for native keyboard
      // Assuming showSoftInputOnFocus means that the native keyboard is used
      if (showSoftInputOnFocus && keyboardDecimalSeparator !== decimalSeparator) {
        parsedText = replaceSeparators({
          value: parsedText,
          decimalSeparator: keyboardDecimalSeparator,
          decimalOverride: decimalSeparator,
        })
      }

      parsedText = replaceSeparators({
        value: parsedText,
        groupingSeparator,
        decimalSeparator,
        groupingOverride: '',
        decimalOverride: '.',
      })

      onChangeText?.(parsedText)
    },
    [decimalSeparator, groupingSeparator, onChangeText, showCurrencySign, showSoftInputOnFocus]
  )

  const { moonpaySupportedFiatCurrency: currency } = useMoonpayFiatCurrencySupportInfo()
  const { addFiatSymbolToNumber } = useLocalizationContext()

  let formattedValue = replaceSeparators({
    value: value ?? '',
    groupingSeparator: ',',
    decimalSeparator: '.',
    groupingOverride: '',
    decimalOverride: decimalSeparator,
  })
  formattedValue = showCurrencySign
    ? addFiatSymbolToNumber({
        value: formattedValue,
        currencyCode: currency.code,
        currencySymbol: currency.symbol,
      })
    : formattedValue

  const textInputProps: TextInputProps = useMemo(
    () => ({
      ref,
      color: !value || dimTextColor ? '$neutral3' : '$neutral1',
      keyboardType: 'numeric' as KeyboardTypeOptions,

      // Use defaultValue here to make TextInput technically an uncontrolled element
      // Since RN v0.54 TextInputs with 'value' has severely degraded performance
      // and a workaround to fix performance is to "fake" it being uncontrolled
      // https://github.com/facebook/react-native/issues/20119#issuecomment-714545951
      defaultValue: formattedValue,
      onChangeText: handleChange,

      ...rest,
    }),
    [dimTextColor, formattedValue, handleChange, rest, value, ref]
  )

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (showSoftInputOnFocus || nextAppState !== 'active') return
      // Dismiss keyboard when app is foregrounded (showSoftInputOnFocus doesn't
      // wotk when the app activates from the background)
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
