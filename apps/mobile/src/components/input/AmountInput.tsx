import React, { forwardRef, useCallback, useEffect, useMemo } from 'react'
import { AppState, Keyboard, KeyboardTypeOptions, TextInput as NativeTextInput } from 'react-native'
import { TextInput, TextInputProps } from 'src/components/input/TextInput'
import { useMoonpayFiatCurrencySupportInfo } from 'src/features/fiatOnRamp/hooks'
import { escapeRegExp } from 'utilities/src/primitives/string'
import { useAppFiatCurrencyInfo } from 'wallet/src/features/fiatCurrency/hooks'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'

const inputRegex = RegExp('^\\d*(?:\\\\[.])?\\d*$') // match escaped "." characters via in a non-capturing group

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
  groupingSeparator: string
  decimalSeparator: string
  groupingOverride: string
  decimalOverride: string
}): string {
  return (
    value
      .split(decimalSeparator)
      // eslint-disable-next-line security/detect-non-literal-regexp
      .map((part) => part.replace(new RegExp(groupingSeparator, 'g'), groupingOverride))
      .join(decimalOverride)
  )
}

export const AmountInput = forwardRef<NativeTextInput, Props>(function _AmountInput(
  { onChangeText, value, showCurrencySign, dimTextColor, showSoftInputOnFocus, editable, ...rest },
  ref
) {
  const { groupingSeparator, decimalSeparator } = useAppFiatCurrencyInfo()

  const handleChange = useCallback(
    (text: string) => {
      const parsedText = replaceSeparators({
        value: showCurrencySign ? text.substring(1) : text,
        groupingSeparator,
        decimalSeparator,
        groupingOverride: '',
        decimalOverride: '.',
      })

      if (parsedText === '' || inputRegex.test(escapeRegExp(parsedText))) {
        onChangeText?.(parsedText)
      }
    },
    [decimalSeparator, groupingSeparator, onChangeText, showCurrencySign]
  )

  const { moonpaySupportedFiatCurrency: currency } = useMoonpayFiatCurrencySupportInfo()
  const { addFiatSymbolToNumber } = useLocalizationContext()

  let formattedValue = showCurrencySign
    ? addFiatSymbolToNumber({
        value,
        currencyCode: currency.code,
        currencySymbol: currency.symbol,
      })
    : value
  // TODO gary MOB-2028 replace temporary hack to handle different separators
  formattedValue =
    editable ?? true
      ? replaceSeparators({
          value: formattedValue ?? '',
          groupingSeparator: ',',
          decimalSeparator: '.',
          groupingOverride: groupingSeparator,
          decimalOverride: decimalSeparator,
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
