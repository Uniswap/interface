import { useTranslation } from 'react-i18next'
import { Eye } from 'ui/src/components/icons/Eye'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { WarningModal } from 'uniswap/src/components/modals/WarningModal/WarningModal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

type ViewOnlyModalProps = {
  onDismiss: () => void
  isOpen: boolean
}

export function ViewOnlyModal({ isOpen, onDismiss }: ViewOnlyModalProps): JSX.Element {
  const { t } = useTranslation()

  return (
    <WarningModal
      caption={t('swap.warning.viewOnly.message')}
      acknowledgeText={t('common.button.dismiss')}
      icon={<Eye color="$neutral2" size="$icon.24" />}
      isOpen={isOpen}
      modalName={ModalName.SwapWarning}
      severity={WarningSeverity.Low}
      title={t('account.wallet.viewOnly.title')}
      onClose={onDismiss}
      onAcknowledge={onDismiss}
    />
  )
}
