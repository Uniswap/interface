import React from 'react'
import { useTranslation } from 'react-i18next'
import { useBiometricName } from 'src/features/biometricsSettings/hooks'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { WarningModal, WarningModalProps } from 'uniswap/src/components/modals/WarningModal/WarningModal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { isAndroid } from 'utilities/src/platform'

type Props = {
  isOpen: boolean
  isTouchIdDevice: boolean
  onConfirm: WarningModalProps['onAcknowledge']
  onClose: WarningModalProps['onClose']
  rejectText?: WarningModalProps['rejectText']
  acknowledgeText?: WarningModalProps['acknowledgeText']
}

export function BiometricAuthWarningModal({
  isOpen,
  isTouchIdDevice,
  onConfirm,
  onClose,
  rejectText,
  acknowledgeText,
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
      rejectText={rejectText ?? t('common.button.back')}
      acknowledgeText={acknowledgeText ?? t('common.button.skip')}
      isOpen={isOpen}
      modalName={ModalName.FaceIDWarning}
      severity={WarningSeverity.Low}
      title={t('settings.setting.biometrics.warning.title')}
      onClose={onClose}
      onAcknowledge={onConfirm}
    />
  )
}
