import React from 'react'
import { requireNativeComponent, ViewProps } from 'react-native'

interface NativeMnemonicDisplayProps {
  mnemonicId: Address
  height: number
}

const NativeMnemonicDisplay = requireNativeComponent<NativeMnemonicDisplayProps>('MnemonicDisplay')

type MnemonicDisplayProps = ViewProps & NativeMnemonicDisplayProps

export function MnemonicDisplay(props: MnemonicDisplayProps): JSX.Element {
  return <NativeMnemonicDisplay style={{ height: props.height }} {...props} />
}
