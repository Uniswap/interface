import React from 'react'
import { requireNativeComponent, ViewProps } from 'react-native'

interface NativeMnemonicDisplayProps {
  mnemonicId: Address
}

const NativeMnemonicDisplay = requireNativeComponent<NativeMnemonicDisplayProps>('MnemonicDisplay')

type MnemonicDisplayProps = ViewProps & NativeMnemonicDisplayProps

const MNEMONIC_DISPLAY_HEIGHT = 348
export function MnemonicDisplay(props: MnemonicDisplayProps): JSX.Element {
  return <NativeMnemonicDisplay style={{ height: MNEMONIC_DISPLAY_HEIGHT }} {...props} />
}
