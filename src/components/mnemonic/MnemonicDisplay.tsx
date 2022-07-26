import React from 'react'
import { requireNativeComponent, ViewProps } from 'react-native'

interface NativeMnemonicDisplayProps {
  address: Address
}

const NativeMnemonicDisplay = requireNativeComponent<NativeMnemonicDisplayProps>('MnemonicDisplay')

type MnemonicDisplayProps = ViewProps & NativeMnemonicDisplayProps

const MNEMONIC_DISPLAY_HEIGHT = 348
export function MnemonicDisplay(props: MnemonicDisplayProps) {
  return <NativeMnemonicDisplay style={{ height: MNEMONIC_DISPLAY_HEIGHT }} {...props} />
}
