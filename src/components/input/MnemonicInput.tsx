import React from 'react'
import { TextStyle } from 'react-native'
import { TextInput, TextInputProps } from 'src/components/input/TextInput'

export function MnemonicInput(props: TextInputProps) {
  return <TextInput multiline={true} numberOfLines={5} pt="md" style={defaultStyle} {...props} />
}

const defaultStyle: TextStyle = {
  minHeight: 120,
  maxHeight: 120,
  minWidth: 300,
  maxWidth: 300,
}
