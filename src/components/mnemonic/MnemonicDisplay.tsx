import Shake from '@shakebugs/react-native-shake'
import React, { useEffect, useRef } from 'react'
import { requireNativeComponent, ViewProps } from 'react-native'

interface NativeMnemonicDisplayProps {
  mnemonicId: Address
}

const NativeMnemonicDisplay = requireNativeComponent<NativeMnemonicDisplayProps>('MnemonicDisplay')

type MnemonicDisplayProps = ViewProps & NativeMnemonicDisplayProps

const MNEMONIC_DISPLAY_HEIGHT = 348
export function MnemonicDisplay(props: MnemonicDisplayProps) {
  const ref = useRef(null)

  // Make sure that the input portion of the screen is not included in the ShakeBug screencapture
  useEffect(() => {
    if (ref.current) {
      Shake.addPrivateView(ref.current)
    }
  }, [])

  return <NativeMnemonicDisplay ref={ref} style={{ height: MNEMONIC_DISPLAY_HEIGHT }} {...props} />
}
