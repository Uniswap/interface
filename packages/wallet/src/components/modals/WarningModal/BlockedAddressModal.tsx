import { useTranslation } from 'react-i18next'
import { WarningModal } from 'wallet/src/components/modals/WarningModal/WarningModal'
import { WarningSeverity } from 'wallet/src/features/transactions/WarningModal/types'
import { ModalName } from 'wallet/src/telemetry/constants'

export function BlockedAddressModal({ onClose }: { onClose: () => void }): JSX.Element {
  const { t } = useTranslation()

  return (
    <WarningModal
      caption={t(
        'This address is blocked on Uniswap Wallet because it is associated with one or more blocked activities. If you believe this is an error, please email compliance@uniswap.org.'
      )}
      closeText={t('I understand')}
      modalName={ModalName.BlockedAddress}
      severity={WarningSeverity.None}
      title={t('Blocked address')}
      onClose={onClose}
    />
  )
}
