import { useTranslation } from 'react-i18next'
import { Flex } from 'ui/src'
import { Sparkle } from 'ui/src/components/icons/Sparkle'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { SmartWalletModal } from 'wallet/src/features/smartWallet/modals/SmartWalletModal'

interface PostSwapSmartWalletNudgeProps {
  isOpen: boolean
  onClose: () => void
  onEnableSmartWallet: () => void
}

export function PostSwapSmartWalletNudge({
  isOpen,
  onClose,
  onEnableSmartWallet,
}: PostSwapSmartWalletNudgeProps): JSX.Element {
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
      title={t('smartWallets.postSwapNudge.title')}
      subtext={t('smartWallets.postSwapNudge.description')}
      primaryButtonText={t('smartWallets.postSwapNudge.enable')}
      primaryButtonOnClick={onEnableSmartWallet}
      secondaryButtonText={t('common.button.notNow')}
      secondaryButtonOnClick={onClose}
      learnMoreUrl={uniswapUrls.helpArticleUrls.smartWalletDelegation}
      modalName={ModalName.PostSwapSmartWalletNudge}
      onClose={onClose}
    />
  )
}
