import React from 'react'
import { useTranslation } from 'react-i18next'
import { WarningSeverity } from 'src/components/modals/WarningModal/types'
import WarningModal, { WarningModalProps } from 'src/components/modals/WarningModal/WarningModal'
import { useBiometricName } from 'src/features/biometrics/hooks'
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
  const authenticationTypeName = useBiometricName(isTouchIdDevice)
  return (
    <WarningModal
      caption={t(
        'If you don’t turn on {{authenticationTypeName}}, anyone who gains access to your device can open Uniswap Wallet and make transactions.',
        { authenticationTypeName }
      )}
      closeText={t('Back')}
      confirmText={t('Skip')}
      modalName={ModalName.FaceIDWarning}
      severity={WarningSeverity.Low}
      title={t('Are you sure?')}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  )
}
