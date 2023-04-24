import React from 'react'
import { useTranslation } from 'react-i18next'
import { WarningSeverity } from 'src/components/modals/WarningModal/types'
import WarningModal, { WarningModalProps } from 'src/components/modals/WarningModal/WarningModal'
import { ModalName } from 'src/features/telemetry/constants'

type Props = {
  isTouchIdDevice: boolean
  onConfirm: WarningModalProps['onConfirm']
  onClose: WarningModalProps['onClose']
}

export function BiometricAuthWarningModal({
  isTouchIdDevice,
  onConfirm,
  onClose,
}: Props): JSX.Element {
  const { t } = useTranslation()
  const authenticationTypeName = isTouchIdDevice ? 'Touch' : 'Face'
  return (
    <WarningModal
      caption={t(
        'If you don’t turn on {{authenticationTypeName}} ID, anyone who gains access to your device can open Uniswap Wallet and make transactions.',
        { authenticationTypeName }
      )}
      closeText={t('Back')}
      confirmText={t('Skip {{authenticationTypeName}} ID', { authenticationTypeName })}
      modalName={ModalName.FaceIDWarning}
      severity={WarningSeverity.Medium}
      title={t('Are you sure?')}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  )
}
