import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { Dialog } from 'uniswap/src/components/dialog/Dialog'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { SendModalProps } from '~/pages/Swap/Send/SendReviewModal'

export const SmartContractSpeedBumpModal = ({ isOpen, onDismiss, onConfirm }: SendModalProps) => {
  const { t } = useTranslation()

  const primaryButton = useMemo(
    () => ({
      text: t('common.button.cancel'),
      onPress: onDismiss,
      variant: 'default' as const,
      emphasis: 'secondary' as const,
    }),
    [t, onDismiss],
  )

  const secondaryButton = useMemo(
    () => ({
      text: t('common.button.continue'),
      onPress: onConfirm,
      variant: 'branded' as const,
    }),
    [t, onConfirm],
  )

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onDismiss}
      icon={<AlertTriangleFilled color="$neutral2" size="$icon.28" />}
      iconBackgroundColor="$surface3"
      title={t('speedBump.smartContractAddress.warning.title')}
      subtext={t('speedBump.smartContractAddress.warning.description')}
      modalName={ModalName.SmartContractSpeedBump}
      primaryButton={primaryButton}
      secondaryButton={secondaryButton}
      displayHelpCTA
    />
  )
}
