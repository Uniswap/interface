import { useTranslation } from 'react-i18next'
import { Eye } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { WarningSeverity } from 'uniswap/src/features/transactions/WarningModal/types'
import { WarningModal } from 'wallet/src/components/modals/WarningModal/WarningModal'

type ViewOnlyModalProps = {
  onDismiss: () => void
  isOpen: boolean
}

export function ViewOnlyModal({ isOpen, onDismiss }: ViewOnlyModalProps): JSX.Element {
  const { t } = useTranslation()

  return (
    <WarningModal
      caption={t('swap.warning.viewOnly.message')}
      confirmText={t('common.button.dismiss')}
      icon={<Eye color="$neutral2" size={iconSizes.icon24} />}
      isOpen={isOpen}
      modalName={ModalName.SwapWarning}
      severity={WarningSeverity.Low}
      title={t('account.wallet.viewOnly.title')}
      onClose={onDismiss}
      onConfirm={onDismiss}
    />
  )
}
