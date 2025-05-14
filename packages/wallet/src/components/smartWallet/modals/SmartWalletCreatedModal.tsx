import { useTranslation } from 'react-i18next'
import { Flex, useSporeColors } from 'ui/src'
import { SmartWallet } from 'ui/src/components/icons'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { SmartWalletModal } from 'wallet/src/features/smartWallet/modals/SmartWalletModal'

interface SmartWalletCreatedModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SmartWalletCreatedModal({ isOpen, onClose }: SmartWalletCreatedModalProps): JSX.Element {
  const colors = useSporeColors()
  const { t } = useTranslation()
  return (
    <SmartWalletModal
      isOpen={isOpen}
      icon={
        <Flex
          backgroundColor="$accent2"
          borderRadius="$rounded12"
          height="$spacing48"
          width="$spacing48"
          alignItems="center"
          justifyContent="center"
          mb="$spacing4"
        >
          <SmartWallet color={colors.accent1.val} size="$icon.24" />
        </Flex>
      }
      title={t('smartWallets.createdModal.title')}
      subtext={t('smartWallets.createdModal.description')}
      primaryButtonText={t('common.done')}
      primaryButtonVariant="default"
      primaryButtonEmphasis="secondary"
      primaryButtonOnClick={onClose}
      learnMoreUrl={uniswapUrls.helpArticleUrls.smartWalletDelegation}
      modalName={ModalName.SmartWalletCreatedModal}
      onClose={onClose}
    />
  )
}
