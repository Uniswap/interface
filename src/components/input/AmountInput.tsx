import React from 'react'
import { TextInput, TextInputProps } from 'src/components/input/TextInput'
import { escapeRegExp } from 'src/utils/string'

const inputRegex = RegExp('^\\d*(?:\\\\[.])?\\d*$') // match escaped "." characters via in a non-capturing group

export function AmountInput({ onChangeText, ...rest }: TextInputProps) {
  const handleChange = (text: string) => {
    if (text === '' || inputRegex.test(escapeRegExp(text))) {
      onChangeText(text)
    }
  }

  return <TextInput keyboardType="numeric" onChangeText={handleChange} {...rest} />
}
