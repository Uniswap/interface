import AlertTriangleFilled from 'components/Icons/AlertTriangleFilled'
import { SendModalProps } from 'pages/Swap/Send/SendReviewModal'
import { useTranslation } from 'react-i18next'
import { useSporeColors } from 'ui/src'
import { Dialog } from 'uniswap/src/components/dialog/Dialog'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

export const SmartContractSpeedBumpModal = ({ isOpen, onDismiss, onConfirm }: SendModalProps) => {
  const { t } = useTranslation()
  const colors = useSporeColors()

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onDismiss}
      icon={<AlertTriangleFilled fill={colors.neutral2.val} size="28px" />}
      iconBackgroundColor="$surface3"
      title={t('speedBump.smartContractAddress.warning.title')}
      subtext={t('speedBump.smartContractAddress.warning.description')}
      modalName={ModalName.SmartContractSpeedBump}
      primaryButtonText={t('common.button.cancel')}
      primaryButtonOnPress={onDismiss}
      primaryButtonVariant="default"
      primaryButtonEmphasis="secondary"
      secondaryButtonText={t('common.button.continue')}
      secondaryButtonOnPress={onConfirm}
      secondaryButtonVariant="branded"
      displayHelpCTA
    />
  )
}
