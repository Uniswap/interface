import { useTranslation } from 'react-i18next'
import { AlertTriangleFilled } from 'ui/src/components/icons'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { SmartWalletModal } from 'wallet/src/components/smartWallet/modals/SmartWalletModal'

/**
 * Props for the SmartWalletDisableWarningModal component.
 */
type SmartWalletDisableWarningModalProps = {
  isOpen: boolean
  onCancel?: () => void
  onContinue: () => void
  onClose: () => void
}

export function SmartWalletDisableWarningModal({
  isOpen,
  onCancel,
  onClose,
  onContinue,
}: SmartWalletDisableWarningModalProps): JSX.Element {
  const { t } = useTranslation()

  return (
    <SmartWalletModal
      horizontalButtons
      isOpen={isOpen}
      icon={<AlertTriangleFilled color="$neutral1" size="$icon.24" />}
      iconBackgroundColor="$surface3"
      title={t('smartWallet.confirmDisableSmartWallet.title')}
      subtext={t('smartWallet.confirmDisableSmartWallet.description')}
      modalName={ModalName.SmartWalletWarningModal}
      primaryButtonText={t('common.button.continue')}
      primaryButtonOnClick={onContinue}
      primaryButtonVariant="default"
      secondaryButtonText={t('common.button.cancel')}
      secondaryButtonOnClick={onCancel}
      onClose={onClose}
    />
  )
}
