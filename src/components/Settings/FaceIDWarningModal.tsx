import React from 'react'
import { useTranslation } from 'react-i18next'
import { WarningSeverity } from 'src/components/modals/WarningModal/types'
import WarningModal, { WarningModalProps } from 'src/components/modals/WarningModal/WarningModal'
import { ModalName } from 'src/features/telemetry/constants'

type Props = {
  onConfirm: WarningModalProps['onConfirm']
  onClose: WarningModalProps['onClose']
}

export function FaceIDWarningModal({ onConfirm, onClose }: Props) {
  const { t } = useTranslation()
  return (
    <WarningModal
      isVisible
      caption={t(
        'If you don’t turn on Face ID, anyone who gains access to your device can open Uniswap Wallet and make transactions.'
      )}
      closeText={t('Back')}
      confirmText={t('Skip Face ID')}
      modalName={ModalName.FaceIDWarning}
      severity={WarningSeverity.Medium}
      title={t('Are you sure?')}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  )
}
