import React, { forwardRef, useCallback, useMemo } from 'react'
import { KeyboardTypeOptions, TextInput as NativeTextInput } from 'react-native'
import { TextInput, TextInputProps } from 'src/components/input/TextInput'
import { escapeRegExp } from 'src/utils/string'

const inputRegex = RegExp('^\\d*(?:\\\\[.])?\\d*$') // match escaped "." characters via in a non-capturing group

type Props = {
  showCurrencySign: boolean
  dimTextColor?: boolean
} & TextInputProps

export const AmountInput = forwardRef<NativeTextInput, Props>(
  ({ onChangeText, value, showCurrencySign, dimTextColor, showSoftInputOnFocus, ...rest }, ref) => {
    const handleChange = useCallback(
      (text: string) => {
        const parsedText = showCurrencySign ? text.substring(1) : text

        if (parsedText === '' || inputRegex.test(escapeRegExp(parsedText))) {
          onChangeText?.(parsedText)
        }
      },
      [onChangeText, showCurrencySign]
    )

    // TODO: handle non-dollar currencies in the future
    const formattedValue = showCurrencySign ? `$${value}` : value

    const textInputProps: TextInputProps = useMemo(
      () => ({
        ref,
        color: !value || dimTextColor ? 'textTertiary' : 'textPrimary',
        keyboardType: 'numeric' as KeyboardTypeOptions,
        value: formattedValue,
        onChangeText: handleChange,

        ...rest,
      }),
      [dimTextColor, formattedValue, handleChange, rest, value, ref]
    )

    // break down into two different components depending on value of showSoftInputOnFocus
    // when showSoftInputOnFocus value changes from false to true, React does not remount the component
    // and therefore the keyboard does not pop up on TextInput focus.
    // returning a separately named component guarantees the remount
    if (showSoftInputOnFocus) {
      return <TextInputWithNativeKeyboard {...textInputProps} />
    }

    return <TextInput {...textInputProps} showSoftInputOnFocus={false} />
  }
)

const TextInputWithNativeKeyboard = (props: TextInputProps) => {
  return <TextInput {...props} />
}
