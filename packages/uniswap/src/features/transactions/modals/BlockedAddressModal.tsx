import { useTranslation } from 'react-i18next'
import { WarningModal } from 'uniswap/src/components/modals/WarningModal/WarningModal'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

export function BlockedAddressModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }): JSX.Element {
  const { t } = useTranslation()

  return (
    <WarningModal
      caption={t('send.warning.blocked.modal.message')}
      closeText={t('common.button.understand')}
      isOpen={isOpen}
      modalName={ModalName.BlockedAddress}
      severity={WarningSeverity.None}
      title={t('send.warning.blocked.modal.title')}
      onClose={onClose}
    />
  )
}
