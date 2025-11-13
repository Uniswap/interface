import AlertTriangleFilled from 'components/Icons/AlertTriangleFilled'
import { SendModalProps } from 'pages/Swap/Send/SendReviewModal'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSporeColors } from 'ui/src'
import { Dialog } from 'uniswap/src/components/dialog/Dialog'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

export const SmartContractSpeedBumpModal = ({ isOpen, onDismiss, onConfirm }: SendModalProps) => {
  const { t } = useTranslation()
  const colors = useSporeColors()

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
    () => ({ text: t('common.button.continue'), onPress: onConfirm, variant: 'branded' as const }),
    [t, onConfirm],
  )

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onDismiss}
      icon={<AlertTriangleFilled fill={colors.neutral2.val} size="28px" />}
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
