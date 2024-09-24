import React from 'react'
import { useTranslation } from 'react-i18next'
import { useBiometricName } from 'src/features/biometrics/hooks'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { WarningSeverity } from 'uniswap/src/features/transactions/WarningModal/types'
import { isAndroid } from 'utilities/src/platform'
import { WarningModal, WarningModalProps } from 'wallet/src/components/modals/WarningModal/WarningModal'

type Props = {
  isOpen: boolean
  isTouchIdDevice: boolean
  onConfirm: WarningModalProps['onConfirm']
  onClose: WarningModalProps['onClose']
}

export function BiometricAuthWarningModal({ isOpen, isTouchIdDevice, onConfirm, onClose }: Props): JSX.Element {
  const { t } = useTranslation()
  const biometricsMethod = useBiometricName(isTouchIdDevice)
  return (
    <WarningModal
      caption={
        isAndroid
          ? t('settings.setting.biometrics.warning.message.android')
          : t('settings.setting.biometrics.warning.message.ios', { biometricsMethod })
      }
      closeText={t('common.button.back')}
      confirmText={t('common.button.skip')}
      isOpen={isOpen}
      modalName={ModalName.FaceIDWarning}
      severity={WarningSeverity.Low}
      title={t('settings.setting.biometrics.warning.title')}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  )
}
