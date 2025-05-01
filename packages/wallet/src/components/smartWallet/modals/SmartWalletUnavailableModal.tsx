import { useTranslation } from 'react-i18next'
import { Flex } from 'ui/src'
import { CloudSlash } from 'ui/src/components/icons'
import { SmartWalletModal } from 'uniswap/src/features/smartWallet/modals/SmartWalletModal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

interface SmartWalletUnavailableModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SmartWalletUnavailableModal({ isOpen, onClose }: SmartWalletUnavailableModalProps): JSX.Element {
  const { t } = useTranslation()
  return (
    <SmartWalletModal
      isOpen={isOpen}
      icon={
        <Flex
          backgroundColor="$surface3"
          borderRadius="$rounded12"
          height="$spacing48"
          width="$spacing48"
          alignItems="center"
          justifyContent="center"
          mb="$spacing4"
        >
          <CloudSlash color="$neutral1" size="$icon.24" />
        </Flex>
      }
      title={t('smartWallets.unavailableModal.title')}
      subtext={t('smartWallets.unavailableModal.description')}
      modalName={ModalName.SmartWalletUnavailableModal}
      // TODO: hook up actual learn more link when available
      learnMoreUrl="#"
      primaryButtonText={t('common.close')}
      primaryButtonVariant="default"
      primaryButtonEmphasis="secondary"
      primaryButtonOnClick={onClose}
      onClose={onClose}
    />
  )
}
