import React from 'react'
import { useTranslation } from 'react-i18next'
import { useBiometricName } from 'src/features/biometrics/hooks'
import { isAndroid } from 'uniswap/src/utils/platform'
import {
  WarningModal,
  WarningModalProps,
} from 'wallet/src/components/modals/WarningModal/WarningModal'
import { WarningSeverity } from 'wallet/src/features/transactions/WarningModal/types'
import { ModalName } from 'wallet/src/telemetry/constants'

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
      modalName={ModalName.FaceIDWarning}
      severity={WarningSeverity.Low}
      title={t('settings.setting.biometrics.warning.title')}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  )
}
