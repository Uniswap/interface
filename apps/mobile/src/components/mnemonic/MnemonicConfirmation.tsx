import React from 'react'
import { useTranslation } from 'react-i18next'
import { requireNativeComponent, StyleProp, ViewProps } from 'react-native'
import { FlexProps, flexStyles, HiddenFromScreenReaders } from 'ui/src'
import { useDeviceDimensions } from 'ui/src/hooks/useDeviceDimensions'

interface NativeMnemonicConfirmationProps {
  mnemonicId: Address
  shouldShowSmallText: boolean
  selectedWordPlaceholder: string
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
  const { t } = useTranslation()
  const { fullHeight } = useDeviceDimensions()
  const shouldShowSmallText = fullHeight < 700

  return (
    <HiddenFromScreenReaders style={flexStyles.fill}>
      <NativeMnemonicConfirmation
        selectedWordPlaceholder={t('onboarding.backup.manual.selectedWordPlaceholder')}
        shouldShowSmallText={shouldShowSmallText}
        style={mnemonicConfirmationStyle}
        {...props}
      />
    </HiddenFromScreenReaders>
  )
}
