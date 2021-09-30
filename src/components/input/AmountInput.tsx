import React from 'react'
import { TextInput, TextInputProps } from 'src/components/input/TextInput'

export function AmountInput(props: TextInputProps) {
  const { onChangeText, ...rest } = props

  const handleChange = (text: string) => {
    onChangeText(text.replace(/[^0-9.,]/g, ''))
  }

  return <TextInput keyboardType="numeric" onChangeText={handleChange} {...rest} />
}
