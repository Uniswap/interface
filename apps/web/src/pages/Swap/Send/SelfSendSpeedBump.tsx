import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSporeColors } from 'ui/src'
import { Dialog } from 'uniswap/src/components/dialog/Dialog'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import AlertTriangleFilled from '~/components/Icons/AlertTriangleFilled'
import { SendModalProps } from '~/pages/Swap/Send/SendReviewModal'

export const SelfSendSpeedBumpModal = ({ isOpen, onDismiss, onConfirm }: SendModalProps) => {
  const { t } = useTranslation()
  const colors = useSporeColors()

  const primaryButton = useMemo(
    () => ({ text: t('common.button.continue'), onPress: onConfirm, variant: 'critical' as const }),
    [t, onConfirm],
  )

  const secondaryButton = useMemo(
    () => ({
      text: t('common.button.cancel'),
      onPress: onDismiss,
      variant: 'default' as const,
      emphasis: 'secondary' as const,
    }),
    [t, onDismiss],
  )

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onDismiss}
      icon={<AlertTriangleFilled fill={colors.statusCritical.val} size="28px" />}
      iconBackgroundColor="$statusCritical2"
      title={t('send.warning.self.title')}
      subtext={t('send.warning.self.message')}
      modalName={ModalName.SelfSendSpeedBump}
      primaryButton={primaryButton}
      secondaryButton={secondaryButton}
    />
  )
}
