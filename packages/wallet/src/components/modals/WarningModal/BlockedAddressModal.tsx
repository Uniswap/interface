import { useTranslation } from 'react-i18next'
import { WarningModal } from 'wallet/src/components/modals/WarningModal/WarningModal'
import { WarningSeverity } from 'wallet/src/features/transactions/WarningModal/types'
import { ModalName } from 'wallet/src/telemetry/constants'

export function BlockedAddressModal({ onClose }: { onClose: () => void }): JSX.Element {
  const { t } = useTranslation()

  return (
    <WarningModal
      caption={t('send.warning.blocked.modal.message')}
      closeText={t('common.button.understand')}
      modalName={ModalName.BlockedAddress}
      severity={WarningSeverity.None}
      title={t('send.warning.blocked.modal.title')}
      onClose={onClose}
    />
  )
}
