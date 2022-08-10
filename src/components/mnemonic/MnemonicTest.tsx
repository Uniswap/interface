import React from 'react'
import { requireNativeComponent, ViewProps, ViewStyle } from 'react-native'

interface NativeMnemonicTestProps {
  mnemonicId: Address
  onTestComplete: () => void
}

const NativeMnemonicTest = requireNativeComponent<NativeMnemonicTestProps>('MnemonicTest')

type MnemonicTestProps = ViewProps & NativeMnemonicTestProps

const mnemonicTestStyle: ViewStyle = {
  // This is the min height needed for native component to function correctly.
  // We handle padding separately wherever the component is placed.
  height: 450,
}

export function MnemonicTest(props: MnemonicTestProps) {
  return <NativeMnemonicTest style={mnemonicTestStyle} {...props} />
}
