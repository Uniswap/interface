import React from 'react'
import { TextInput, TextInputProps } from 'src/components/input/TextInput'
import { escapeRegExp } from 'src/utils/string'

const inputRegex = RegExp('^\\d*(?:\\\\[.])?\\d*$') // match escaped "." characters via in a non-capturing group

type Props = {
  showCurrencySign: boolean
  dimTextColor?: boolean
} & TextInputProps

export function AmountInput({
  onChangeText,
  value,
  showCurrencySign,
  dimTextColor,
  ...rest
}: Props) {
  const handleChange = (text: string) => {
    const parsedText = showCurrencySign ? text.substring(1) : text

    if (parsedText === '' || inputRegex.test(escapeRegExp(parsedText))) {
      onChangeText?.(parsedText)
    }
  }

  // TODO: handle non-dollar currencies in the future
  const formattedValue = showCurrencySign ? `$${value}` : value

  return (
    <TextInput
      color={!value || dimTextColor ? 'textTertiary' : 'textPrimary'}
      keyboardType="numeric"
      value={formattedValue}
      onChangeText={handleChange}
      {...rest}
    />
  )
}
