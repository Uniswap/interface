import React from 'react'
import { requireNativeComponent, StyleProp, ViewProps } from 'react-native'
import { FlexProps, flexStyles, HiddenFromScreenReaders, useDeviceDimensions } from 'ui/src'

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

const mnemonicConfirmationStyle: StyleProp<FlexProps> = {
  flex: 1,
  flexGrow: 1,
}

export function MnemonicConfirmation(props: MnemonicConfirmationProps): JSX.Element {
  const { fullHeight } = useDeviceDimensions()
  const shouldShowSmallText = fullHeight < 700

  return (
    <HiddenFromScreenReaders style={flexStyles.fill}>
      <NativeMnemonicConfirmation
        shouldShowSmallText={shouldShowSmallText}
        style={mnemonicConfirmationStyle}
        {...props}
      />
    </HiddenFromScreenReaders>
  )
}
