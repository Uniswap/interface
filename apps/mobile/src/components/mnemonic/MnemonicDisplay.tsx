import React from 'react'
import { requireNativeComponent, StyleSheet, ViewProps } from 'react-native'

interface NativeMnemonicDisplayProps {
  mnemonicId: Address
}

const NativeMnemonicDisplay = requireNativeComponent<NativeMnemonicDisplayProps>('MnemonicDisplay')

type MnemonicDisplayProps = ViewProps & NativeMnemonicDisplayProps

const styles = StyleSheet.create({
  mnemonicDisplay: {
    flex: 1,
    flexGrow: 1,
  },
})

export function MnemonicDisplay(props: MnemonicDisplayProps): JSX.Element {
  return <NativeMnemonicDisplay style={styles.mnemonicDisplay} {...props} />
}
