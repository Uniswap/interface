import React from 'react'
import { useTranslation } from 'react-i18next'
import { WarningSeverity } from 'src/components/modals/WarningModal/types'
import WarningModal, { WarningModalProps } from 'src/components/modals/WarningModal/WarningModal'
import { ModalName } from 'src/features/telemetry/constants'

type Props = {
  isFingerprintDevice: boolean
  onConfirm: WarningModalProps['onConfirm']
  onClose: WarningModalProps['onClose']
}

export function BiometricAuthWarningModal({ isFingerprintDevice, onConfirm, onClose }: Props) {
  const { t } = useTranslation()
  return (
    <WarningModal
      isVisible
      caption={
        isFingerprintDevice
          ? t(
              'If you don’t turn on Touch ID, anyone who gains access to your device can open Uniswap Wallet and make transactions.'
            )
          : t(
              'If you don’t turn on Face ID, anyone who gains access to your device can open Uniswap Wallet and make transactions.'
            )
      }
      closeText={t('Back')}
      confirmText={isFingerprintDevice ? t('Skip Touch ID') : t('Skip Face ID')}
      modalName={ModalName.FaceIDWarning}
      severity={WarningSeverity.Medium}
      title={t('Are you sure?')}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  )
}
