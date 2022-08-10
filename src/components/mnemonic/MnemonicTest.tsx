import React from 'react'
import { requireNativeComponent, ViewProps } from 'react-native'
import { dimensions } from 'src/styles/sizing'

interface NativeMnemonicTestProps {
  mnemonicId: Address
  onTestComplete: () => void
}

const NativeMnemonicTest = requireNativeComponent<NativeMnemonicTestProps>('MnemonicTest')

type MnemonicTestProps = ViewProps & NativeMnemonicTestProps

const MNEMONIC_TEST_HEIGHT = dimensions.fullHeight - 100
export function MnemonicTest(props: MnemonicTestProps) {
  return <NativeMnemonicTest style={{ height: MNEMONIC_TEST_HEIGHT }} {...props} />
}
