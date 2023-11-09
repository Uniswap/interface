import React, { forwardRef, useCallback, useEffect, useMemo } from 'react'
import { AppState, Keyboard, KeyboardTypeOptions, TextInput as NativeTextInput } from 'react-native'
import { TextInput, TextInputProps } from 'src/components/input/TextInput'
import { useMoonpayFiatCurrencySupportInfo } from 'src/features/fiatOnRamp/hooks'
import { escapeRegExp } from 'utilities/src/primitives/string'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'

const inputRegex = RegExp('^\\d*(?:\\\\[.])?\\d*$') // match escaped "." characters via in a non-capturing group

type Props = {
  showCurrencySign: boolean
  dimTextColor?: boolean
} & TextInputProps

const periodRegExp = /\./g
const commaRegExp = /,/g

export function convertToDotAsDecimalSeparator(input: string): string {
  // Determine the decimal and thousand separators
  const commaCount = (input.match(commaRegExp) || []).length
  const dotCount = (input.match(periodRegExp) || []).length

  let decimalSeparator: string | null = null
  let thousandSeparator: string | null = null

  if (commaCount === 1 && dotCount === 0) {
    decimalSeparator = ','
  } else if (dotCount === 1 && commaCount === 0) {
    decimalSeparator = '.'
  } else if (commaCount > 1 && dotCount === 0) {
    thousandSeparator = ','
  } else if (dotCount > 1 && commaCount === 0) {
    thousandSeparator = '.'
  } else if (dotCount > 0 && commaCount > 0) {
    // If both commas and dots are present, the one that appears last is the decimal separator
    decimalSeparator = input.lastIndexOf(',') > input.lastIndexOf('.') ? ',' : '.'
    thousandSeparator = decimalSeparator === ',' ? '.' : ','
  }

  const thousandRegExp = thousandSeparator === '.' ? periodRegExp : commaRegExp

  if (decimalSeparator) {
    const parts = input.split(decimalSeparator)
    const decimalPart = parts.pop()
    const thousandsPart = parts.join('')

    // Remove thousands separators
    const withoutThousandsSeparators = thousandSeparator
      ? thousandsPart.replace(thousandRegExp, '')
      : thousandsPart

    // Combine withoutThousandsSeparators and decimalPart with a dot as a separator
    return `${withoutThousandsSeparators}.${decimalPart}`
  } else {
    // Input has only thousands separators
    const result = input.replace(thousandRegExp, '')
    return result
  }
}

export const AmountInput = forwardRef<NativeTextInput, Props>(function _AmountInput(
  { onChangeText, value, showCurrencySign, dimTextColor, showSoftInputOnFocus, ...rest },
  ref
) {
  const handleChange = useCallback(
    (text: string) => {
      const parsedText = convertToDotAsDecimalSeparator(showCurrencySign ? text.substring(1) : text)

      if (parsedText === '' || inputRegex.test(escapeRegExp(parsedText))) {
        onChangeText?.(parsedText)
      }
    },
    [onChangeText, showCurrencySign]
  )

  const { moonpaySupportedFiatCurrency: currency } = useMoonpayFiatCurrencySupportInfo()
  const { addFiatSymbolToNumber } = useLocalizationContext()

  const formattedValue = showCurrencySign
    ? addFiatSymbolToNumber({
        value,
        currencyCode: currency.code,
        currencySymbol: currency.symbol,
      })
    : value

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
