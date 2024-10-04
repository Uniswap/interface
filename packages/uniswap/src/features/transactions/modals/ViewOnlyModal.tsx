import { useTranslation } from 'react-i18next'
import { Eye } from 'ui/src/components/icons/Eye'
import { iconSizes } from 'ui/src/theme'
import { WarningModal } from 'uniswap/src/components/modals/WarningModal/WarningModal'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
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
      icon={<Eye color="$neutral2" size={iconSizes.icon24} />}
      isOpen={isOpen}
      modalName={ModalName.SwapWarning}
      severity={WarningSeverity.Low}
      title={t('account.wallet.viewOnly.title')}
      onClose={onDismiss}
      onAcknowledge={onDismiss}
    />
  )
}
