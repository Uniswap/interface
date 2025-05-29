import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { Sparkle } from 'ui/src/components/icons/Sparkle'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { SmartWalletModal } from 'uniswap/src/features/smartWallet/modals/SmartWalletModal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

interface SmartWalletEducationalModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SmartWalletEducationalModal({ isOpen, onClose }: SmartWalletEducationalModalProps): JSX.Element {
  const { t } = useTranslation()
  return (
    <SmartWalletModal
      isOpen={isOpen}
      icon={
        // TODO: remove this placeholder once design has settled on the icon
        <Flex
          backgroundColor="$accent2"
          borderRadius="$rounded12"
          height="$spacing48"
          width="$spacing48"
          alignItems="center"
          justifyContent="center"
          mb="$spacing4"
        >
          <Sparkle color="$accent1" size="$icon.24" />
        </Flex>
      }
      title={t('smartWallets')}
      subtext={
        <Flex gap="$spacing8">
          <Text variant="body3" color="$neutral2" textAlign="center">
            {t('smartWallets.educationalModal.description')}
          </Text>
          <Text variant="body3" color="$neutral2" textAlign="center">
            {t('smartWallets.educationalModal.info')}
          </Text>
        </Flex>
      }
      primaryButtonText={t('common.close')}
      primaryButtonVariant="default"
      primaryButtonEmphasis="secondary"
      primaryButtonOnClick={onClose}
      learnMoreUrl={uniswapUrls.helpArticleUrls.smartWalletDelegation}
      modalName={ModalName.SmartWalletEducationalModal}
      onClose={onClose}
    />
  )
}
