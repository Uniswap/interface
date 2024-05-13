import { useTranslation } from 'react-i18next'
import { Eye } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { WarningModal } from 'wallet/src/components/modals/WarningModal/WarningModal'
import { WarningSeverity } from 'wallet/src/features/transactions/WarningModal/types'
import { ModalName } from 'wallet/src/telemetry/constants'

type ViewOnlyModalProps = {
  onDismiss: () => void
}

export function ViewOnlyModal({ onDismiss }: ViewOnlyModalProps): JSX.Element {
  const { t } = useTranslation()

  return (
    <WarningModal
      caption={t('swap.warning.viewOnly.message')}
      confirmText={t('common.button.dismiss')}
      icon={<Eye color="$neutral2" size={iconSizes.icon24} />}
      modalName={ModalName.SwapWarning}
      severity={WarningSeverity.Low}
      title={t('account.wallet.viewOnly.title')}
      onClose={onDismiss}
      onConfirm={onDismiss}
    />
  )
}
