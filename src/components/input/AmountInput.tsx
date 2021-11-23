import React from 'react'
import { TextInput, TextInputProps } from 'src/components/input/TextInput'

export function AmountInput({ onChangeText, ...rest }: TextInputProps) {
  const handleChange = (text: string) => {
    onChangeText(text.replace(/[^0-9.,]/g, ''))
  }

  return <TextInput keyboardType="numeric" onChangeText={handleChange} {...rest} />
}
