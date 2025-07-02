import { useTranslation } from 'react-i18next'
import { CloudSlash } from 'ui/src/components/icons'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { SmartWalletModal } from 'wallet/src/components/smartWallet/modals/SmartWalletModal'

interface SmartWalletUnavailableModalProps {
  isOpen: boolean
  onClose: () => void
  displayName: string
}

export function SmartWalletUnavailableModal({
  isOpen,
  onClose,
  displayName,
}: SmartWalletUnavailableModalProps): JSX.Element {
  const { t } = useTranslation()
  return (
    <SmartWalletModal
      isOpen={isOpen}
      icon={<CloudSlash color="$neutral1" size="$icon.24" />}
      iconBackgroundColor="$surface3"
      title={t('smartWallets.unavailableModal.title')}
      subtext={t('smartWallets.unavailableModal.description', { displayName })}
      modalName={ModalName.SmartWalletUnavailableModal}
      learnMoreUrl={uniswapUrls.helpArticleUrls.mismatchedImports}
      primaryButtonText={t('common.close')}
      primaryButtonVariant="default"
      primaryButtonEmphasis="secondary"
      primaryButtonOnClick={onClose}
      onClose={onClose}
    />
  )
}
