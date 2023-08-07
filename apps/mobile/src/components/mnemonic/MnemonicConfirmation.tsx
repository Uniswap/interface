import React from 'react'
import { requireNativeComponent, StyleProp, ViewProps } from 'react-native'
import { BoxProps } from 'src/components/layout/Box'
import { dimensions } from 'ui/src/theme/restyle/sizing'

interface NativeMnemonicConfirmationProps {
  mnemonicId: Address
  shouldShowSmallText: boolean
  onConfirmComplete: () => void
}

const NativeMnemonicConfirmation =
  requireNativeComponent<NativeMnemonicConfirmationProps>('MnemonicConfirmation')

type MnemonicConfirmationProps = ViewProps & {
  mnemonicId: Address
  onConfirmComplete: () => void
}

const mnemonicConfirmationStyle = (shouldShowSmallVersion: boolean): StyleProp<BoxProps> => {
  return {
    // This is the min height needed for native component to function correctly.
    // We handle padding separately wherever the component is placed.
    height: shouldShowSmallVersion ? 380 : 450,
  }
}

export function MnemonicConfirmation(props: MnemonicConfirmationProps): JSX.Element {
  const shouldShowSmallText = dimensions.fullHeight < 700

  return (
    <NativeMnemonicConfirmation
      shouldShowSmallText={shouldShowSmallText}
      style={mnemonicConfirmationStyle(shouldShowSmallText)}
      {...props}
    />
  )
}
