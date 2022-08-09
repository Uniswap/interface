import React from 'react'
import { requireNativeComponent, ViewProps } from 'react-native'

interface NativeMnemonicTestProps {
  mnemonicId: Address
  onTestComplete: () => void
}

const NativeMnemonicTest = requireNativeComponent<NativeMnemonicTestProps>('MnemonicTest')

type MnemonicTestProps = ViewProps & NativeMnemonicTestProps

const MNEMONIC_TEST_HEIGHT = 400
export function MnemonicTest(props: MnemonicTestProps) {
  return <NativeMnemonicTest style={{ height: MNEMONIC_TEST_HEIGHT }} {...props} />
}
