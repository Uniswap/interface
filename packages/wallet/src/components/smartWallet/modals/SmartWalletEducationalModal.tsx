import { useTranslation } from 'react-i18next'
import { Flex, Text, useSporeColors } from 'ui/src'
import { SmartWallet } from 'ui/src/components/icons'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { SmartWalletModal } from 'wallet/src/components/smartWallet/modals/SmartWalletModal'

interface SmartWalletEducationalModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SmartWalletEducationalModal({ isOpen, onClose }: SmartWalletEducationalModalProps): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()

  return (
    <SmartWalletModal
      isOpen={isOpen}
      icon={<SmartWallet color={colors.accent1.val} size="$icon.24" />}
      iconBackgroundColor="$accent2"
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
      primaryButton={{ text: t('common.close'), onClick: onClose, variant: 'default', emphasis: 'secondary' }}
      learnMoreUrl={uniswapUrls.helpArticleUrls.smartWalletDelegation}
      modalName={ModalName.SmartWalletEducationalModal}
      onClose={onClose}
    />
  )
}
